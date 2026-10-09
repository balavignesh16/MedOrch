export interface PatientListRow {
  patient_id: number;
  name: string;
  dept: string;
  status: string;
  risk_score: number;
}

export interface PatientDetailRow {
  patient_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  insurance_provider: string;
  department: string | null;
  admission_date: string | null;
  diagnosis: string | null;
  readmission_risk_score: number;
}

export interface LabResultRow {
  lab_id: number;
  patient_id: number;
  test_name: string;
  test_date: string;
  reference_range: string;
  test_value: string | number;
  test_unit: string;
  is_abnormal: number | boolean;
}

export interface MedicationRow {
  medication_id: number;
  patient_id: number;
  drug_name: string;
  dosage: string;
  frequency: string;
  status: string;
  start_date?: string;
  prescribed_date?: string;
}

export interface PatientDetailsResponse {
  patient: PatientDetailRow;
  labs: LabResultRow[];
  medications: MedicationRow[];
}

export function isPatientDetailsResponse(value: unknown): value is PatientDetailsResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PatientDetailsResponse>;
  return typeof candidate.patient === 'object'
    && candidate.patient !== null
    && typeof candidate.patient.patient_id === 'number'
    && Array.isArray(candidate.labs)
    && Array.isArray(candidate.medications);
}
