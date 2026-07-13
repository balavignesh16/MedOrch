"use client";

import React from 'react';
import { Activity, LayoutDashboard, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Command Center', path: '/', icon: LayoutDashboard },
    { name: 'Patients', path: '/patients', icon: User },
  ];

  return (
    <div className="w-64 h-full bg-surface-glass border-r border-border-glass backdrop-blur-md flex flex-col p-6">
      <div className="flex items-center space-x-3 mb-10">
        <Activity className="w-8 h-8 text-brand-teal" />
        <h1 className="text-xl font-bold tracking-wider">MedOrch</h1>
      </div>
      
      <nav className="flex-1 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-surface-glass-hover text-brand-teal' 
                  : 'hover:bg-surface-glass-hover text-slate-400 hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Link 
          href="/settings" 
          className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
            pathname === '/settings'
              ? 'bg-surface-glass-hover text-brand-teal'
              : 'hover:bg-surface-glass-hover text-slate-400 hover:text-foreground'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
