import { SystemHealthMetric } from './platformTypes';

export function getSystemHealth(): SystemHealthMetric[] {
  return [
    { service: 'PostgreSQL Data Warehouse', status: 'Operational', latency: '12ms', uptime: '99.99%' },
    { service: 'Redis Cache Cluster', status: 'Operational', latency: '2ms', uptime: '100%' },
    { service: 'ML Prediction Service', status: 'Operational', latency: '45ms', uptime: '99.95%' },
    { service: 'EHR Synchronization API', status: 'Degraded', latency: '350ms', uptime: '98.5%' },
    { service: 'Authentication Provider', status: 'Operational', latency: '15ms', uptime: '100%' }
  ];
}
