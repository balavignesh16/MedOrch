import React from 'react';
import type { fetchExportHistory } from '@/lib/platformLogic';
import { DownloadCloud, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ExportCenterProps {
  exports: Awaited<ReturnType<typeof fetchExportHistory>>;
}

export function ExportCenter({ exports }: ExportCenterProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4 text-brand-teal" />;
      case 'Failed': return <XCircle className="w-4 h-4 text-danger" />;
      default: return <Clock className="w-4 h-4 text-white/50" />;
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
       <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-brand-teal" /> Export Center
        </h3>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
         {exports.map(exp => (
            <div key={exp.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
               <div>
                  <h4 className="text-sm font-medium text-white">{exp.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] text-white/40 uppercase tracking-wider">{exp.format}</span>
                     <span className="text-[10px] text-white/40">• {exp.date}</span>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  {getStatusIcon(exp.status)}
                  <span className={`text-xs ${exp.status === 'Completed' ? 'text-brand-teal' : 'text-danger'}`}>{exp.status}</span>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
}
