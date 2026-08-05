import { AuditLog } from './platformTypes';

export function getAuditLogs(): AuditLog[] {
  return [
    { id: 'a1', action: 'Login', user: 'admin@medorch.local', module: 'Auth', timestamp: '10 mins ago', ip: '192.168.1.45' },
    { id: 'a2', action: 'Exported Financial Dashboard', user: 'cfo@medorch.local', module: 'Financial', timestamp: '2 hours ago', ip: '10.0.0.12' },
    { id: 'a3', action: 'Changed Benchmark Target (Readmission)', user: 'admin@medorch.local', module: 'Settings', timestamp: '5 hours ago', ip: '192.168.1.45' },
    { id: 'a4', action: 'Saved Workspace View', user: 'cmo@medorch.local', module: 'Workspace', timestamp: '1 day ago', ip: '10.0.1.22' }
  ];
}
