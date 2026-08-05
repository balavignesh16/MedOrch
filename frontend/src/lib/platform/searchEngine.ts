import { PlatformSearchResult } from './platformTypes';

export function performGlobalSearch(query: string): PlatformSearchResult[] {
  if (!query) return [];
  
  return [
    { id: 's1', type: 'Patient', title: 'John Doe', subtitle: 'MRN: 10928374', module: 'Population Health', url: '/population?search=john' },
    { id: 's2', type: 'Dashboard', title: 'Executive Command Center', module: 'Executive', url: '/' },
    { id: 's3', type: 'KPI', title: 'Readmission Rate', subtitle: 'Current: 15.2%', module: 'Clinical Quality', url: '/quality' },
    { id: 's4', type: 'Insight', title: 'Targeted Readmission Reduction', module: 'Strategy', url: '/strategy' }
  ].filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.type.toLowerCase().includes(query.toLowerCase()));
}
