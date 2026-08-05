import React from 'react';
import { ShieldAlert, List } from 'lucide-react';

interface AuditCenterProps {
  logs: any[];
}

export function AuditCenter({ logs }: AuditCenterProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-brand-teal" /> Audit & Compliance Logs
        </h3>
        <button className="text-xs bg-white/10 text-white px-3 py-1 rounded hover:bg-white/20 transition-colors">Export Logs</button>
      </div>
      <div className="flex-1 overflow-x-auto">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-white/10 text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Module</th>
                  <th className="p-4 font-semibold">IP Address</th>
               </tr>
            </thead>
            <tbody className="text-sm text-white/80">
               {logs.map(log => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                     <td className="p-4 whitespace-nowrap text-white/50 text-xs">{log.timestamp}</td>
                     <td className="p-4 whitespace-nowrap text-brand-cyan">{log.user}</td>
                     <td className="p-4 font-medium">{log.action}</td>
                     <td className="p-4">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{log.module}</span>
                     </td>
                     <td className="p-4 font-mono text-xs text-white/40">{log.ip}</td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}
