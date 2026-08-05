"use client";

import React from 'react';
import { AdministrationKpiGrid } from '@/components/administration/administration-kpi-grid';
import { AdministrationGovernance } from '@/components/administration/administration-governance';
import { DepartmentScorecards } from '@/components/administration/department-scorecards';
import { StaffingIntelligence } from '@/components/administration/staffing-intelligence';
import { CapacityAllocation } from '@/components/administration/capacity-allocation';
import { ComplianceDashboard } from '@/components/administration/compliance-dashboard';
import { AdministrativeTrends } from '@/components/administration/administrative-trends';
import { AdministrativeInsights } from '@/components/administration/administrative-insights';

interface DashboardClientProps {
  overview: any;
  scorecards: any;
  staffing: any;
  capacity: any;
  compliance: any;
  governance: any;
  trends: any;
  insights: any;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  overview,
  scorecards,
  staffing,
  capacity,
  compliance,
  governance,
  trends,
  insights
}) => {
  return (
    <div className="space-y-6">
      {/* Top Row: KPIs and Governance */}
      <div className="space-y-6">
         <AdministrationKpiGrid overview={overview} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
           <DepartmentScorecards scorecards={scorecards} />
        </div>
        <div className="xl:col-span-1">
           <AdministrationGovernance governance={governance} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
         <StaffingIntelligence staffing={staffing} />
         <CapacityAllocation capacity={capacity} />
      </div>

      <div className="space-y-6">
         <ComplianceDashboard compliance={compliance} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
           <AdministrativeTrends trends={trends} />
        </div>
        <div className="xl:col-span-1">
           <AdministrativeInsights insights={insights} />
        </div>
      </div>
    </div>
  );
};
