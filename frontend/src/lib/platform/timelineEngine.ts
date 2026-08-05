import { TimelineEvent } from './platformTypes';

export function getTimelineEvents(): TimelineEvent[] {
  return [
    { id: 't1', module: 'Financial', action: 'Cost Model Updated', actor: 'Finance Admin', timestamp: '10 mins ago', details: 'Updated base DRG rates for Q3.' },
    { id: 't2', module: 'Clinical', action: 'Insight Generated', actor: 'System', timestamp: '1 hour ago', details: 'High risk pneumonia cohort identified.' },
    { id: 't3', module: 'Executive', action: 'Dashboard Export', actor: 'CEO', timestamp: '3 hours ago', details: 'Exported Executive Summary to PDF.' },
    { id: 't4', module: 'Operations', action: 'Resource Reallocation', actor: 'Charge Nurse', timestamp: '5 hours ago', details: 'Moved 3 float nurses to Med-Surg.' }
  ];
}
