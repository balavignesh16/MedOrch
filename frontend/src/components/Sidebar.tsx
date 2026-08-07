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
    { name: 'Enterprise Home', href: '/', icon: LayoutDashboard, roles: ['admin', 'doctor', 'billing'] },
    { name: 'Population Health', href: '/population', icon: Users, roles: ['admin', 'doctor', 'billing'] },
    { name: 'Clinical Quality', href: '/quality', icon: Activity, roles: ['admin', 'doctor'] },
    { name: 'Operational Intelligence', href: '/operations', icon: ActivitySquare, roles: ['admin', 'billing'] },
    { name: 'Financial Intelligence', href: '/financial', icon: TrendingUp, roles: ['admin', 'billing'] },
    { name: 'Administration', href: '/administration', icon: Users, roles: ['admin'] },
    { name: 'Strategy & Decision Hub', href: '/strategy', icon: Map, roles: ['admin'] },
    { name: 'Predictive Analytics', href: '/predictive', icon: ActivitySquare, roles: ['admin', 'doctor', 'billing'] },
    { name: 'Clinical Triage', href: '/agents/clinical_triage', icon: Stethoscope, roles: ['admin', 'doctor'] },
    { name: 'Billing & Claims', href: '/agents/billing', icon: CreditCard, roles: ['admin', 'billing'] }
  ];

  const visibleLinks = links.filter(link => !user || link.roles.includes(user.role as string));

  return (
    <aside className="w-[300px] h-screen bg-transparent flex flex-col shrink-0 p-4 pb-8 border-r border-white/5 relative">
      <div className="absolute top-0 right-0 w-[200px] h-[300px] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
      <div className="h-full flex flex-col relative z-10">
        <div className="p-6 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-teal to-brand-cyan flex items-center justify-center shrink-0 shadow-[0_4px_20px_rgba(45,212,191,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-white/20 blur-sm"></div>
            <Activity className="w-5 h-5 text-white relative z-10" />
          </div>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight">MedOrch</span>
          <div className="ml-auto relative">
            <Bell className="w-5 h-5 text-white/40 hover:text-white transition-colors cursor-pointer" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-orange border-2 border-surface-black rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.8)]"></span>
          </div>
        </div>

        {user && (
          <div className="px-6 mb-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 shadow-sm backdrop-blur-xl group hover:border-white/20 transition-all duration-300">
              <p className="text-[10px] text-white/40 font-bold mb-1 uppercase tracking-widest">Logged in as</p>
              <p className="text-sm font-bold text-white group-hover:text-brand-teal transition-colors">{user.name}</p>
              <p className="text-xs text-brand-teal mt-0.5 capitalize font-mono font-medium">{user.role} Access</p>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold text-white/30 mb-4 tracking-[0.2em] uppercase">Enterprise Modules</p>
          
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${isActive ? 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20 shadow-[inset_0_0_20px_rgba(45,212,191,0.05)]' : 'text-white/50 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/10'}`}>
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-brand-teal shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                    />
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-teal' : 'text-white/40 group-hover:text-brand-teal'} transition-colors duration-300`} />
                  <span className={`font-semibold text-sm ${isActive ? 'text-white' : ''}`}>{link.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-2 relative z-50">
          <button onClick={logout} className="w-full block">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-danger/70 hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all duration-300 group">
              <LogOut className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
              <span className="font-semibold text-sm">Secure Sign Out</span>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
