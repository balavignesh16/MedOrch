import React from 'react';
import { FileText, Download, FileSpreadsheet, FileIcon } from 'lucide-react';

interface ReportCenterProps {
  reports: any[];
}

export function ReportCenter({ reports }: ReportCenterProps) {
  const getFormatIcon = (format: string) => {
    if (format === 'PDF') return <FileIcon className="w-4 h-4 text-red-400" />;
    if (format === 'Excel') return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    if (format === 'CSV') return <FileText className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-white/50" />;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-teal" /> Report Center
        </h3>
        <button className="px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-xs font-medium text-white">
          Generate New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {reports.map(report => (
          <div key={report.id} className="group p-3 rounded-xl bg-white/5 border border-white/10 hover:border-brand-teal/50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
                {getFormatIcon(report.format)}
              </div>
              <div>
                <h4 className="text-sm font-medium text-white group-hover:text-brand-teal transition-colors">{report.title}</h4>
                <p className="text-xs text-white/50 flex items-center gap-2 mt-1">
                  <span>{report.type}</span>
                  <span>•</span>
                  <span>{report.generated}</span>
                </p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
