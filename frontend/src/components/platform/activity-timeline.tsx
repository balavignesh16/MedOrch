import React from 'react';
import { Activity, Clock, Shield } from 'lucide-react';

interface ActivityTimelineProps {
  events: any[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/10">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-teal" /> Global Activity Timeline
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
          {events.map((event, index) => (
            <div key={event.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                 <Activity className="w-4 h-4 text-brand-cyan" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-brand-teal uppercase tracking-wider">{event.module}</span>
                  <span className="text-[10px] text-white/40">{event.timestamp}</span>
                </div>
                <h4 className="text-sm font-semibold text-white">{event.action}</h4>
                <p className="text-xs text-white/60 mt-1">{event.details}</p>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-white/40">
                   <Shield className="w-3 h-3" /> {event.actor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
