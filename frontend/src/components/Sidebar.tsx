"use client";

import React from 'react';
import { Activity, LayoutDashboard, Settings, User, Bot, LineChart, Users, TrendingUp, ShieldCheck, PieChart, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'AI Copilot', path: '/', icon: Bot },
    { name: 'Command Center', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Patient Directory', path: '/patients', icon: User },
    { name: 'Resource Forecast', path: '/forecast', icon: LineChart },
    { name: 'Staffing Module', path: '/staffing', icon: Users },
    { name: 'Financials Module', path: '/financials', icon: PieChart },
    { name: 'Cyber GRC Audit', path: '/security', icon: ShieldCheck },
    { name: 'Simulation Control', path: '/settings/simulation', icon: Zap },
  ];

  return (
    <div className="w-72 h-full glass-card flex flex-col p-6 rounded-r-3xl z-10">
      <div className="flex items-center space-x-3 mb-10">
        <div className="p-2 bg-brand-teal/20 rounded-xl">
          <Activity className="w-8 h-8 text-brand-teal" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">MedOrch</h1>
      </div>
      
      <nav className="flex-1 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path} 
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-foreground border border-transparent'
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
          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 ${
            pathname === '/settings'
              ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'hover:bg-white/5 text-slate-400 hover:text-foreground border border-transparent'
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
