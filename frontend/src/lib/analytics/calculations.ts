export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function buildCostSqlExpression(): string {
  return `(
    100 +
    (time_in_hospital * 25) +
    (num_medications * 3) +
    (num_lab_procedures * 5) +
    (num_procedures * 20) +
    (number_emergency * 30) +
    (number_inpatient * 40) +
    (number_outpatient * 5) +
    CASE WHEN readmitted = '<30' THEN 50 ELSE 0 END
  )`;
}
