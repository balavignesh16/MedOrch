import React from 'react';
import { EnterpriseCommandCenter } from './enterprise-command-center';
import { GlobalSearch } from './global-search';
import { NotificationCenter } from './notification-center';
import { WorkspaceCenter } from './workspace-center';
import { ActivityTimeline } from './activity-timeline';

interface HomeDashboardProps {
  searchData: any[];
  notifications: any[];
  workspaces: any[];
  timeline: any[];
}

export function HomeDashboard({ searchData, notifications, workspaces, timeline }: HomeDashboardProps) {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
         <div>
            <h1 className="text-3xl font-bold text-white mb-2">
               Welcome to MedOrch Enterprise
            </h1>
            <p className="text-white/60 max-w-2xl">
               Your central hub for healthcare analytics, collaboration, and platform governance.
            </p>
         </div>
      </div>

      {/* Command Center (KPIs) */}
      <EnterpriseCommandCenter />

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <GlobalSearch results={searchData} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <WorkspaceCenter workspaces={workspaces} />
               <ActivityTimeline events={timeline} />
            </div>
         </div>
         <div className="lg:col-span-1">
            <NotificationCenter notifications={notifications} />
         </div>
      </div>
    </div>
  );
}
