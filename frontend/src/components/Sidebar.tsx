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
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['admin', 'doctor', 'billing'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'billing'] },
    { name: 'Clinical Triage', href: '/agents/clinical', icon: Stethoscope, roles: ['admin', 'doctor'] },
    { name: 'Patient Navigation', href: '/agents/navigation', icon: Map, roles: ['admin', 'doctor'] },
    { name: 'Resource Optimization', href: '/agents/optimization', icon: Activity, roles: ['admin'] },
    { name: 'Predictive Analytics', href: '/agents/predictive', icon: TrendingUp, roles: ['admin'] },
    { name: 'Cyber GRC', href: '/agents/grc', icon: ShieldCheck, roles: ['admin'] },
    { name: 'Billing & Claims', href: '/agents/billing', icon: CreditCard, roles: ['admin', 'billing'] },
  ];

  // Filter links based on user role
  const visibleLinks = links.filter(link => !user || link.roles.includes(user.role as string));

  return (
    <div className="w-64 h-screen bg-surface-glass border-r border-border-glass backdrop-blur-xl flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">MedOrch</h1>
          </div>
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
          </button>
        </div>
        {user && (
          <div className="mt-6 p-3 bg-white/5 rounded-xl border border-border-glass">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-brand-teal capitalize">{user.role} Access</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          AI Workspaces
        </p>
        {visibleLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          
          return (
            <Link key={link.name} href={link.href}>
              <div className={`relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-teal' : ''}`} />
                <span className="font-medium text-sm">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-border-glass space-y-2">
        <Link href="#">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" />
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
    </div>
  );
};

export default Sidebar;
