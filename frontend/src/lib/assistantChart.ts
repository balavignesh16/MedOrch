export interface BarChartSpec {
  type: 'bar';
  categoryLabel: string;
  valueLabel: string;
  data: Array<{ category: string; value: number }>;
}

export interface ScatterChartSpec {
  type: 'scatter';
  xLabel: string;
  yLabel: string;
  data: Array<{ x: number; y: number }>;
}

export type ChartSpec = BarChartSpec | ScatterChartSpec;

export const MAX_BAR_CATEGORIES = 40;
export const MIN_SCATTER_POINTS = 3;
export const MAX_SCATTER_POINTS = 500;

function isNumeric(value: unknown): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function columnIsCategorical(rows: unknown[][], index: number): boolean {
  let sawString = false;
  for (const row of rows) {
    const cell = row[index];
    if (cell !== null && cell !== undefined && typeof cell !== 'string') return false;
    if (typeof cell === 'string') sawString = true;
  }
  return sawString;
}

function columnIsNumeric(rows: unknown[][], index: number): boolean {
  let sawNumber = false;
  for (const row of rows) {
    const cell = row[index];
    if (!isNumeric(cell)) return false;
    if (typeof cell === 'number') sawNumber = true;
  }
  return sawNumber;
}

/**
 * Picks a chart purely from the result's shape, never from model output:
 * one categorical + one numeric column -> bar; two numeric columns -> scatter;
 * anything else -> no chart (the table is always shown regardless).
 */
export function chooseChart(columns: string[] | undefined, rows: unknown[][] | undefined): ChartSpec | null {
  if (!columns || !rows || columns.length !== 2 || rows.length < 2) return null;
  const numeric = [columnIsNumeric(rows, 0), columnIsNumeric(rows, 1)];

  if (columnIsCategorical(rows, 0) && numeric[1]) {
    if (rows.length > MAX_BAR_CATEGORIES) return null;
    const data = rows
      .filter((row) => typeof row[1] === 'number')
      .map((row) => ({ category: row[0] === null || row[0] === undefined ? 'Unknown' : String(row[0]), value: row[1] as number }));
    return data.length >= 2 ? { type: 'bar', categoryLabel: columns[0], valueLabel: columns[1], data } : null;
  }

  if (numeric[0] && numeric[1]) {
    const data = rows
      .filter((row) => typeof row[0] === 'number' && typeof row[1] === 'number')
      .slice(0, MAX_SCATTER_POINTS)
      .map((row) => ({ x: row[0] as number, y: row[1] as number }));
    return data.length >= MIN_SCATTER_POINTS ? { type: 'scatter', xLabel: columns[0], yLabel: columns[1], data } : null;
  }
  return null;
}
