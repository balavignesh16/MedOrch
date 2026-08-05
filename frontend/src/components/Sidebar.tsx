"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Stethoscope, Settings, ShieldCheck, TrendingUp, Activity, ActivitySquare, Users, CreditCard, Map, LogOut, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    {
      name: 'Enterprise Home', href: '/', icon: LayoutDashboard, roles: ['admin', 'doctor', 'billing']
    },

    {
      name: 'Population Health', href: '/population', icon: Users, roles: ['admin', 'doctor', 'billing']
    },
    {
      name: 'Clinical Quality', href: '/quality', icon: Activity, roles: ['admin', 'doctor']
    },
    {
      name: 'Operational Intelligence', href: '/operations', icon: ActivitySquare, roles: ['admin', 'billing']
    },
    {
      name: 'Financial Intelligence', href: '/financial', icon: TrendingUp, roles: ['admin', 'billing']
    },
    {
      name: 'Administration', href: '/administration', icon: Users, roles: ['admin']
    },
    {
      name: 'Strategy & Decision Hub', href: '/strategy', icon: Map, roles: ['admin']
    },
    {
      name: 'Predictive Analytics', href: '/predictive', icon: ActivitySquare, roles: ['admin', 'doctor', 'billing']
    },
    // {
    //   name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'doctor', 'billing']
    // },
    {
      name: 'Clinical Triage', href: '/agents/clinical_triage', icon: Stethoscope, roles: ['admin', 'doctor']
    },
    // {
    //   name: 'Patient Navigation', href: '/agents/patient_navigation', icon: Map, roles: ['admin', 'doctor']
    // },
    // {
    //   name: 'Resource Optimization', href: '/agents/resource_optimization', icon: Activity, roles: ['admin']
    // },
    // {
    //   name: 'Predictive Analytics', href: '/agents/predictive_analytics', icon: TrendingUp, roles: ['admin']
    // },
    // {
    //   name: 'Cyber GRC', href: '/agents/cyber_grc', icon: ShieldCheck, roles: ['admin']
    // },
    {
      name: 'Billing & Claims', href: '/agents/billing', icon: CreditCard, roles: ['admin', 'billing']
    }
  ];

  // Filter links based on user role
  const visibleLinks = links.filter(link => !user || link.roles.includes(user.role as string));

  return (
    <aside className="w-72 h-screen bg-transparent flex flex-col shrink-0 p-4 pb-8">
      <div className="h-full flex flex-col">
        <div className="p-6 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal to-brand-cyan flex items-center justify-center shrink-0 shadow-[0_4px_10px_rgba(20,184,166,0.2)]">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tighter">MedOrch</span>
          <div className="ml-auto relative">
            <Bell className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
          </div>
        </div>

        {user && (
          <div className="px-6 mb-8">
            <div className="bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-sm backdrop-blur-md">
              <p className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-widest">Logged in as</p>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-brand-teal mt-0.5 capitalize font-mono">{user.role} Access</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-slate-600 mb-4 tracking-[0.2em] uppercase">AI Workspaces</p>
          
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden group ${isActive ? 'bg-brand-teal/10 text-brand-teal' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'}`}>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal"
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-teal' : 'text-slate-400 group-hover:text-brand-teal'} transition-colors`} />
                  <span className="font-medium text-sm">{link.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2 relative z-50">
          <button onClick={logout} className="w-full block">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5 opacity-70" />
              <span className="font-medium text-sm">Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
