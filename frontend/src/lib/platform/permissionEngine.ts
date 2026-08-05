export function getUserPermissions(role: string) {
  const base = ['view_dashboards', 'export_reports'];
  if (role === 'admin') {
    return [...base, 'manage_users', 'manage_settings', 'view_audit_logs'];
  }
  if (role === 'doctor') {
    return [...base, 'view_patient_phi', 'manage_cohorts'];
  }
  return base;
}
