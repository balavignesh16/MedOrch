import React from 'react';
import { DashboardClient } from './DashboardClient';
import { 
  getAdministrativeOverview, 
  getDepartmentScorecards, 
  getStaffingIntelligence,
  getCapacityAllocation,
  getComplianceDashboard,
  getAdministrativeGovernance,
  getAdministrativeTrends,
  getAdministrativeInsights
} from '@/app/actions/administrationDb';

export default async function AdministrationPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const filters = {
    time_period: searchParams.time_period || 'last_30_days',
  };

  const [
    overview,
    scorecards,
    staffing,
    capacity,
    compliance,
    governance,
    trends,
    insights
  ] = await Promise.all([
    getAdministrativeOverview(filters),
    getDepartmentScorecards(filters),
    getStaffingIntelligence(filters),
    getCapacityAllocation(filters),
    getComplianceDashboard(filters),
    getAdministrativeGovernance(filters),
    getAdministrativeTrends(filters),
    getAdministrativeInsights(filters)
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              Administrative & Hospital Management
            </h1>
            <p className="text-brand-gray">
              Executive overview of hospital administration, staffing, capacity, and operational governance.
            </p>
          </div>
          <div className="bg-brand-purple/10 border border-brand-purple/20 px-4 py-2 rounded-xl">
             <p className="text-xs text-brand-purple font-medium">
               <strong>Administrative Analytics Model (Analytical)</strong><br/>
               This dashboard estimates administrative performance using clinical utilization patterns.<br/>
               It does not represent actual HR, payroll, staffing, or compliance systems.
             </p>
          </div>
        </div>

        <DashboardClient 
          overview={overview} 
          scorecards={scorecards}
          staffing={staffing}
          capacity={capacity}
          compliance={compliance}
          governance={governance}
          trends={trends}
          insights={insights}
        />
      </div>
  );
}
