import React from 'react';
import type { fetchStrategicRoadmap } from '@/lib/strategyLogic';
import { Map } from 'lucide-react';

interface StrategicRoadmapProps {
  data: Awaited<ReturnType<typeof fetchStrategicRoadmap>>;
}

export function StrategicRoadmap({ data }: StrategicRoadmapProps) {
  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Map className="w-5 h-5 mr-2 text-brand-teal" />
          Strategic Roadmap
        </h3>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
        {data.map((phase, idx) => (
          <div key={idx} className="relative pl-4 border-l-2 border-brand-teal/30">
            <div className="absolute w-2.5 h-2.5 bg-brand-teal rounded-full -left-[6px] top-1.5"></div>
            <h4 className="text-sm font-bold text-brand-teal mb-3 uppercase tracking-wider">{phase.phase}</h4>
            <div className="flex flex-col gap-2">
              {phase.items.map((item: string, i: number) => (
                <div key={i} className="bg-slate-900/50 border border-white/5 rounded-lg p-3 hover:bg-white/5 transition-colors">
                  <span className="text-sm text-white/90 font-medium">{item}</span>
                </div>
              ))}
              {phase.items.length === 0 && (
                <span className="text-xs text-white/30 italic">No initiatives identified for this phase.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
