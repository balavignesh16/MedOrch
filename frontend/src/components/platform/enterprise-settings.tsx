import React from 'react';
import type { fetchEnterpriseSettings } from '@/lib/platformLogic';
import { Settings, Sliders, Monitor } from 'lucide-react';

interface EnterpriseSettingsProps {
  settings: Awaited<ReturnType<typeof fetchEnterpriseSettings>>;
}

export function EnterpriseSettings({ settings }: EnterpriseSettingsProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-teal" /> Enterprise Settings
        </h3>
        <button className="text-xs bg-brand-teal text-black font-semibold px-3 py-1 rounded-lg hover:bg-brand-teal/90 transition-colors">
           Save Changes
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
         {/* Preferences */}
         <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2 mb-4">
               <Monitor className="w-3 h-3" /> UI Preferences
            </h4>
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 p-3 border border-white/10 rounded-xl">
                  <span className="text-xs text-white/60 block mb-1">Theme</span>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none" defaultValue={settings.theme}>
                     <option>Dark</option>
                     <option>Light</option>
                     <option>System</option>
                  </select>
               </div>
               <div className="bg-white/5 p-3 border border-white/10 rounded-xl">
                  <span className="text-xs text-white/60 block mb-1">Default Dashboard</span>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none" defaultValue={settings.defaultDashboard}>
                     <option>Enterprise Home</option>
                     <option>Executive</option>
                     <option>Clinical</option>
                  </select>
               </div>
            </div>
         </div>
         
         {/* Benchmarking */}
         <div>
             <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-2 mb-4">
               <Sliders className="w-3 h-3" /> Benchmarking Configurations
            </h4>
            <div className="space-y-3">
               <div className="flex items-center justify-between bg-white/5 p-3 border border-white/10 rounded-xl">
                  <div>
                     <span className="text-sm text-white block">Target Readmission Rate (%)</span>
                     <span className="text-xs text-white/40">CMS Penalty Threshold</span>
                  </div>
                  <input type="number" defaultValue={settings.benchmarkConfig.targetReadmissionRate} className="w-20 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-white text-right focus:outline-none" />
               </div>
               <div className="flex items-center justify-between bg-white/5 p-3 border border-white/10 rounded-xl">
                  <div>
                     <span className="text-sm text-white block">Target Avg Length of Stay (Days)</span>
                     <span className="text-xs text-white/40">Hospital-wide Average</span>
                  </div>
                  <input type="number" defaultValue={settings.benchmarkConfig.targetAvgLos} className="w-20 bg-black/20 border border-white/10 rounded-lg p-1.5 text-sm text-white text-right focus:outline-none" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
