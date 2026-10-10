import { existsSync, readFileSync } from 'fs';
import path from 'path';

export type IdMappings = Record<string, Record<number, string>>;

/** Splits one CSV line, honouring double-quoted fields that contain commas. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}

/** Parses the UCI IDs_mapping.csv, which stacks three "x_id,description" tables
 * separated by blank lines, into { column: { id: description } }. */
export function parseIdMappings(text: string): IdMappings {
  const mappings: IdMappings = {};
  let current: Record<number, string> | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) {
      current = null;
      continue;
    }
    const cells = splitCsvLine(rawLine);
    if (cells[0].endsWith('_id') && cells[1]?.trim() === 'description') {
      current = mappings[cells[0]] ??= {};
      continue;
    }
    const id = Number.parseInt(cells[0], 10);
    if (current && Number.isFinite(id) && cells[1] !== undefined) current[id] = cells[1].trim();
  }
  return mappings;
}

let cached: IdMappings | null = null;

export function loadIdMappings(): IdMappings {
  if (cached) return cached;
  const engineDir = process.env.MEDORCH_ENGINE_DIR
    ? path.resolve(process.env.MEDORCH_ENGINE_DIR)
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), '..', 'engine');
  const file = path.join(engineDir, 'diabetes_data', 'dataset_diabetes', 'IDs_mapping.csv');
  cached = existsSync(file) ? parseIdMappings(readFileSync(file, 'utf-8')) : {};
  return cached;
}

/** Human label for a code, falling back to the raw code so nothing is hidden. */
export function labelFor(mappings: IdMappings, column: string, code: number | string | null): string {
  if (code === null || code === undefined) return 'Unknown';
  const numeric = typeof code === 'number' ? code : Number.parseInt(code, 10);
  return mappings[column]?.[numeric] ?? `Code ${code}`;
}
