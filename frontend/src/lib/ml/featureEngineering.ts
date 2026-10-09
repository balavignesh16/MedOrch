export interface StandardizedFeatures {
  [feature: string]: number;
  age: number;
  genderCode: number;
  raceCode: number;
  comorbidityCount: number;
  procedureCount: number;
  medicationCount: number;
  labCount: number;
  erVisits: number;
  inpatientVisits: number;
  outpatientVisits: number;
  daysInHospital: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function numericValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function generateStandardizedFeatures(patientRecord: unknown): StandardizedFeatures {
  const record = asRecord(patientRecord);
  return {
    age: numericValue(record.age, 50),
    genderCode: record.gender === 'Female' ? 1 : 0,
    raceCode: record.race === 'Caucasian' ? 1 : record.race === 'AfricanAmerican' ? 2 : 0,
    comorbidityCount: Math.max(0, numericValue(record.number_diagnoses ?? record.diagnoses, 1) - 1),
    procedureCount: numericValue(record.num_procedures),
    medicationCount: numericValue(record.num_medications ?? record.medications),
    labCount: numericValue(record.num_lab_procedures),
    erVisits: numericValue(record.number_emergency ?? record.recentErVisits),
    inpatientVisits: numericValue(record.number_inpatient),
    outpatientVisits: numericValue(record.number_outpatient),
    daysInHospital: numericValue(record.time_in_hospital)
  };
}
