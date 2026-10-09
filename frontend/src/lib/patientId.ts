export function parsePatientId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) return null;
  const patientId = Number(rawId);
  if (!Number.isSafeInteger(patientId) || patientId <= 0) return null;
  return patientId;
}

