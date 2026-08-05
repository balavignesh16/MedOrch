import { DocumentationItem } from './platformTypes';

export function getDocumentation(): DocumentationItem[] {
  return [
    { id: 'd1', title: 'MedOrch Enterprise Architecture v2.0', category: 'Architecture', lastUpdated: 'August 1st, 2026' },
    { id: 'd2', title: 'Sprint 10 Completion Report', category: 'Sprint Report', lastUpdated: 'Today' },
    { id: 'd3', title: 'AI Governance & Compliance Framework', category: 'Governance', lastUpdated: 'July 15th, 2026' },
    { id: 'd4', title: 'Platform Developer Guide', category: 'Guide', lastUpdated: 'July 1st, 2026' }
  ];
}
