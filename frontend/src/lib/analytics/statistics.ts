export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

export function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function getVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = calculateAverage(values);
  const squareDiffs = values.map((value) => {
    const diff = value - avg;
    return diff * diff;
  });
  return calculateAverage(squareDiffs);
}

export function getStandardDeviation(values: number[]): number {
  return Math.sqrt(getVariance(values));
}

export function calculateTrendIndicator(current: number, previous: number): 'up' | 'down' | 'flat' {
  if (current > previous * 1.05) return 'up';
  if (current < previous * 0.95) return 'down';
  return 'flat';
}
