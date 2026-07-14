"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Stethoscope, Settings, ShieldCheck, TrendingUp, Activity, Users, CreditCard, Map, LogOut, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    {
      name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'doctor', 'billing']
    },
    {
      name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'billing']
    },
    {
      name: 'Clinical Triage', href: '/agents/clinical_triage', icon: Stethoscope, roles: ['admin', 'doctor']
    },
    {
      name: 'Patient Navigation', href: '/agents/patient_navigation', icon: Map, roles: ['admin', 'doctor']
    },
    {
      name: 'Resource Optimization', href: '/agents/resource_optimization', icon: Activity, roles: ['admin']
    },
    {
      name: 'Predictive Analytics', href: '/agents/predictive_analytics', icon: TrendingUp, roles: ['admin']
    },
    {
      name: 'Cyber GRC', href: '/agents/cyber_grc', icon: ShieldCheck, roles: ['admin']
    },
    {
      name: 'Billing & Claims', href: '/agents/billing', icon: CreditCard, roles: ['admin', 'billing']
    }
  ];

  // Filter links based on user role
  const visibleLinks = links.filter(link => !user || link.roles.includes(user.role as string));

  return (
    <aside className="w-64 h-screen bg-obsidian border-r border-border-glass flex flex-col shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-brand-cyan flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">MedOrch</span>
        <div className="ml-auto relative">
          <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors cursor-pointer" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
        </div>
      </div>

      {user && (
        <div className="px-6 mb-8">
          <div className="bg-surface-obsidian border border-border-glass rounded-xl p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Logged in as</p>
            <p className="text-sm font-bold text-white">{user.name}</p>
            <p className="text-xs text-brand-teal mt-0.5 capitalize">{user.role} Access</p>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-slate-600 mb-4 tracking-wider">AI WORKSPACES</p>
        
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-surface-glass text-brand-teal border border-border-neon shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border-glass space-y-2">
        <Link href="/settings">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${pathname === '/settings' ? 'bg-surface-glass text-brand-teal border border-border-neon shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            <Settings className="w-4 h-4" />
            <span className="font-medium text-sm">Settings</span>
          </div>
        </Link>
        <button onClick={logout} className="w-full">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:text-white hover:bg-red-500/20 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
