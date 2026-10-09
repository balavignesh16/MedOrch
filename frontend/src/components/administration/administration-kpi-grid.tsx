import React from 'react';
import type { fetchAdministrativeOverview } from '@/lib/administrationLogic';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Activity, ShieldCheck, Users, Briefcase } from 'lucide-react';
import { AdministrativeScoreTransparency } from './administrative-score-transparency';

interface AdministrationKpiGridProps {
  overview: Awaited<ReturnType<typeof fetchAdministrativeOverview>>;
}

export const AdministrationKpiGrid: React.FC<AdministrationKpiGridProps> = ({ overview }) => {
  const metadata = {
    dataSource: 'Administrative Analytics Model (Analytical)',
    lastUpdated: new Date().toISOString().split('T')[0],
    refreshPolicy: 'Real-time (Analytical)',
    confidence: 'High (Estimated)',
    target: 'Optimal'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Administrative Performance</h2>
        <AdministrativeScoreTransparency overview={overview} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Department Efficiency"
          value={`${overview.metrics.departmentPerformance}%`}
          trend={{ value: 2.1, direction: 'up', period: 'last month' }}
          status={overview.metrics.departmentPerformance >= 90 ? 'Excellent' : 'Good'}
          icon={<Briefcase className="w-5 h-5" />}
          metadata={metadata}
        />
        <KpiCard
          title="Staff Utilization"
          value={`${overview.metrics.staffingEfficiency}%`}
          trend={{ value: 1.5, direction: 'down', period: 'last month' }}
          status={overview.metrics.staffingEfficiency >= 85 ? 'Good' : 'Watch'}
          icon={<Users className="w-5 h-5" />}
          metadata={metadata}
        />
        <KpiCard
          title="Capacity Usage"
          value={`${overview.metrics.capacityUtilization}%`}
          trend={{ value: 3.2, direction: 'up', period: 'last month' }}
          status={overview.metrics.capacityUtilization > 90 ? 'Critical' : 'Good'}
          icon={<Activity className="w-5 h-5" />}
          metadata={metadata}
        />
        <KpiCard
          title="Compliance Score"
          value={`${overview.metrics.complianceHealth}%`}
          trend={{ value: 0.5, direction: 'up', period: 'last month' }}
          status={overview.metrics.complianceHealth >= 95 ? 'Excellent' : 'Watch'}
          icon={<ShieldCheck className="w-5 h-5" />}
          metadata={metadata}
        />
      </div>
    </div>
  );
};
