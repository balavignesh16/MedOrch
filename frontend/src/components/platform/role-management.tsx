import React from 'react';
import { Shield, Users, Check, X } from 'lucide-react';

interface RoleManagementProps {
  permissions: string[];
}

export function RoleManagement({ permissions }: RoleManagementProps) {
  const allPermissions = [
    { id: 'view_dashboards', label: 'View Dashboards' },
    { id: 'view_patient_phi', label: 'View Patient PHI' },
    { id: 'manage_cohorts', label: 'Manage Patient Cohorts' },
    { id: 'export_reports', label: 'Export Reports' },
    { id: 'manage_settings', label: 'Manage Enterprise Settings' },
    { id: 'manage_users', label: 'Manage Users & Roles' },
    { id: 'view_audit_logs', label: 'View Audit Logs' }
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
       <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-teal" /> Role-Based Access Control
        </h3>
      </div>
      <div className="flex-1 p-4">
         <div className="flex items-center gap-4 mb-6">
            <div className="bg-black/20 border border-white/10 rounded-lg p-3 flex-1 flex items-center gap-3">
               <Users className="w-5 h-5 text-brand-teal" />
               <div>
                  <span className="text-xs text-white/50 block">Current Role Context</span>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Administrator</span>
               </div>
            </div>
         </div>

         <div className="space-y-2">
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Permissions Overview</h4>
            {allPermissions.map(p => {
               const hasPerm = permissions.includes(p.id);
               return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                     <span className="text-sm text-white/80">{p.label}</span>
                     {hasPerm ? (
                        <div className="flex items-center gap-1 text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded text-xs font-bold">
                           <Check className="w-3 h-3" /> Enabled
                        </div>
                     ) : (
                        <div className="flex items-center gap-1 text-white/30 bg-white/5 px-2 py-0.5 rounded text-xs font-bold">
                           <X className="w-3 h-3" /> Disabled
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
