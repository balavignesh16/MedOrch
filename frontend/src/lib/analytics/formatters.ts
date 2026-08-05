export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPatientCount(count: number): string {
  return new Intl.NumberFormat('en-US').format(count);
}

export function formatDays(days: number, decimals: number = 1): string {
  if (isNaN(days)) return '0d';
  return `${days.toFixed(decimals)}d`;
}

export function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A (Excellent)';
  if (score >= 75) return 'B (Good)';
  if (score >= 60) return 'C (Watch)';
  return 'D (Critical)';
}
