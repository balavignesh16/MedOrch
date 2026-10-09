export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function buildCostSqlExpression(): string {
  return `(
    ${COST.BASE_ENCOUNTER} +
    (time_in_hospital * ${COST.LOS_PER_DAY}) +
    (num_medications * ${COST.MEDICATION}) +
    (num_lab_procedures * ${COST.LAB_PROCEDURE}) +
    (num_procedures * ${COST.CLINICAL_PROCEDURE}) +
    (number_emergency * ${COST.EMERGENCY_VISIT}) +
    (number_inpatient * ${COST.INPATIENT_VISIT}) +
    (number_outpatient * ${COST.OUTPATIENT_VISIT}) +
    CASE WHEN readmitted = '<30' THEN ${COST.READMISSION_PENALTY} ELSE 0 END
  )`;
}
import { FINANCIAL_COST_MULTIPLIERS as COST } from './config';
