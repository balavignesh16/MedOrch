import { PlatformSearchResult } from './platformTypes';
import { QueryFactory } from '@/lib/analytics/queryFactory';

export function performGlobalSearch(query: string): PlatformSearchResult[] {
  if (!query || query.trim().length === 0) return [];
  
  const q = query.toLowerCase().trim();
  
  const results: PlatformSearchResult[] = [];

  // Check if query is numeric (likely a patient MRN/ID)
  const isNumeric = /^\d+$/.test(q);
  if (isNumeric) {
    try {
      const dbPatients = QueryFactory.executeCustomQuery<Array<{ patient_nbr: number | string }>>(
        `SELECT DISTINCT patient_nbr FROM hospital_readmissions WHERE CAST(patient_nbr AS TEXT) LIKE ? LIMIT 5`,
        [`%${q}%`],
        []
      );
      
      if (Array.isArray(dbPatients)) {
        dbPatients.forEach((p, i) => {
          results.push({
            id: `p${i}`,
            type: 'Patient',
            title: `Patient ${p.patient_nbr}`,
            subtitle: `MRN: ${p.patient_nbr}`,
            module: 'Population Health',
            url: `/population/patient/${p.patient_nbr}`
          });
        });
      }
    } catch (err) {
      console.error("Search DB Error:", err);
    }
  }

  const mockData: PlatformSearchResult[] = [
    { id: 's3', type: 'Dashboard', title: 'Executive Command Center', module: 'Executive', url: '/' },
    { id: 's4', type: 'Dashboard', title: 'Nursing Operations', module: 'Operations', url: '/operations' },
    { id: 's5', type: 'KPI', title: 'Readmission Rate', subtitle: 'Current: 15.2%', module: 'Clinical Quality', url: '/quality' },
    { id: 's6', type: 'KPI', title: 'Average Length of Stay', subtitle: 'Current: 4.8d', module: 'Predictive Analytics', url: '/predictive' },
    { id: 's7', type: 'Insight', title: 'Targeted Readmission Reduction', module: 'Strategy', url: '/strategy' },
    { id: 's8', type: 'Insight', title: 'ICU Capacity Warning', module: 'Operations', url: '/operations' },
    { id: 's9', type: 'Report', title: 'Q3 Board Report Draft', module: 'Administration', url: '/administration' },
    { id: 's10', type: 'Department', title: 'Cardiology', subtitle: '85% Utilized', module: 'Operations', url: '/operations' }
  ];

  const filteredMock = mockData.filter(r => 
    r.title.toLowerCase().includes(q) || 
    (r.subtitle && r.subtitle.toLowerCase().includes(q)) || 
    r.module.toLowerCase().includes(q)
  );

  return [...results, ...filteredMock];
}
