import React from 'react';
import type { fetchSavedWorkspaces } from '@/lib/platformLogic';
import { LayoutTemplate, Bookmark, Filter, PieChart, Star } from 'lucide-react';

interface WorkspaceCenterProps {
  workspaces: Awaited<ReturnType<typeof fetchSavedWorkspaces>>;
}

export function WorkspaceCenter({ workspaces }: WorkspaceCenterProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Dashboard': return <LayoutTemplate className="w-4 h-4 text-brand-teal" />;
      case 'Filter': return <Filter className="w-4 h-4 text-brand-orange" />;
      case 'Report': return <Bookmark className="w-4 h-4 text-brand-cyan" />;
      case 'Chart': return <PieChart className="w-4 h-4 text-danger" />;
      default: return <LayoutTemplate className="w-4 h-4 text-white/50" />;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-brand-teal" /> Saved Workspaces
        </h3>
        <button className="text-xs text-brand-teal hover:text-white transition-colors">View All</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {workspaces.map(ws => (
          <div key={ws.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(ws.type)}
                <h4 className="text-sm font-medium text-white">{ws.name}</h4>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{ws.type}</span>
            </div>
            <p className="text-xs text-white/50">Last Modified: {ws.lastModified}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
