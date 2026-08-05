import { WorkspaceView } from './platformTypes';

export function getSavedWorkspaces(): WorkspaceView[] {
  return [
    { id: 'w1', name: 'Morning Operations Huddle', type: 'Dashboard', lastModified: 'Today, 08:00 AM' },
    { id: 'w2', name: 'High-Cost Patient Cohort', type: 'Filter', lastModified: 'Yesterday, 15:30 PM' },
    { id: 'w3', name: 'Q3 Board Report Draft', type: 'Report', lastModified: '2 days ago' }
  ];
}
