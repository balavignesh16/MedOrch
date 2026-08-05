import { PlatformNotification } from './platformTypes';

export function getNotifications(): PlatformNotification[] {
  return [
    { id: 'n1', title: 'ICU Capacity Warning', message: 'Cardiology ICU at 95% capacity.', level: 'Critical', module: 'Operations', timestamp: '10m ago', read: false },
    { id: 'n2', title: 'Readmission Target Breached', message: 'Failing to meet CMS readmission targets for the current quarter.', level: 'Warning', module: 'Clinical', timestamp: '1h ago', read: false },
    { id: 'n3', title: 'System Update', message: 'EHR sync delayed by 5 minutes.', level: 'Info', module: 'System', timestamp: '2h ago', read: true },
    { id: 'n4', title: 'Staffing Shortage Resolved', message: 'ER nursing staff minimum ratio met.', level: 'Resolved', module: 'Administration', timestamp: '3h ago', read: true }
  ];
}
