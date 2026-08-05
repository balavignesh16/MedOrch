export interface StandardizedFeatures {
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

export function generateStandardizedFeatures(patientRecord: any): StandardizedFeatures {
  return {
    age: patientRecord.age || 50,
    genderCode: patientRecord.gender === 'Female' ? 1 : 0,
    raceCode: patientRecord.race === 'Caucasian' ? 1 : patientRecord.race === 'AfricanAmerican' ? 2 : 0,
    comorbidityCount: (patientRecord.number_diagnoses || 1) - 1,
    procedureCount: patientRecord.num_procedures || 0,
    medicationCount: patientRecord.num_medications || 0,
    labCount: patientRecord.num_lab_procedures || 0,
    erVisits: patientRecord.number_emergency || 0,
    inpatientVisits: patientRecord.number_inpatient || 0,
    outpatientVisits: patientRecord.number_outpatient || 0,
    daysInHospital: patientRecord.time_in_hospital || 0
  };
}
