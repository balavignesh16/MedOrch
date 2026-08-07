import React from 'react';
import { EnterpriseCommandCenter } from './enterprise-command-center';
import { GlobalSearch } from './global-search';
import { NotificationCenter } from './notification-center';
import { WorkspaceCenter } from './workspace-center';
import { ActivityTimeline } from './activity-timeline';
import { Sparkles, Calendar } from 'lucide-react';

interface HomeDashboardProps {
  searchData: any[];
  notifications: any[];
  workspaces: any[];
  timeline: any[];
}

export function HomeDashboard({ searchData, notifications, workspaces, timeline }: HomeDashboardProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 relative">
      {/* Background Decorators */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[300px] bg-brand-teal/10 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8 relative">
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/70 uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <Calendar className="w-4 h-4 text-brand-teal" />
                  {today}
               </span>
               <span className="px-4 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-xs font-bold text-brand-cyan uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  System Optimal
               </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/50 tracking-tight mb-3 drop-shadow-sm">
               Welcome to MedOrch Enterprise
            </h1>
            <p className="text-lg text-white/50 max-w-2xl font-medium leading-relaxed">
               Your central hub for healthcare analytics, intelligent collaboration, and platform-wide governance.
            </p>
         </div>
      </div>

      {/* Command Center (KPIs) */}
      <EnterpriseCommandCenter />

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <GlobalSearch results={searchData} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <WorkspaceCenter workspaces={workspaces} />
               <ActivityTimeline events={timeline} />
            </div>
         </div>
         <div className="lg:col-span-4">
            <NotificationCenter notifications={notifications} />
         </div>
      </div>
    </div>
  );
}
