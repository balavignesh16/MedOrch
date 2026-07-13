import React from 'react';
import { Activity, LayoutDashboard, Settings, User } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 h-full bg-surface-glass border-r border-border-glass backdrop-blur-md flex flex-col p-6">
      <div className="flex items-center space-x-3 mb-10">
        <Activity className="w-8 h-8 text-brand-teal" />
        <h1 className="text-xl font-bold tracking-wider">MedOrch</h1>
      </div>
      
      <nav className="flex-1 space-y-4">
        <a href="#" className="flex items-center space-x-3 p-3 rounded-lg bg-surface-glass-hover text-brand-teal transition-all">
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Command Center</span>
        </a>
        <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-glass-hover text-slate-400 hover:text-foreground transition-all">
          <User className="w-5 h-5" />
          <span className="font-medium">Patients</span>
        </a>
      </nav>

      <div className="mt-auto">
        <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-glass-hover text-slate-400 hover:text-foreground transition-all">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
