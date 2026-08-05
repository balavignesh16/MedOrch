import React from 'react';
import { BookOpen, FileText, ChevronRight } from 'lucide-react';

interface DocumentationCenterProps {
  docs: any[];
}

export function DocumentationCenter({ docs }: DocumentationCenterProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-teal" /> Enterprise Documentation Center
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {docs.map(doc => (
           <div key={doc.id} className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-brand-teal/50 cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-teal" />
                 </div>
                 <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-brand-teal transition-colors">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] text-white/40 uppercase tracking-wider">{doc.category}</span>
                       <span className="text-[10px] text-white/40">• {doc.lastUpdated}</span>
                    </div>
                 </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-brand-teal transition-colors" />
           </div>
        ))}
      </div>
    </div>
  );
}
