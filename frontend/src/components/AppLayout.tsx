"use client";

import React from 'react';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  if (isLogin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
         {/* Deeper Ambient Background Glows */}
         <div className="fixed top-0 left-1/4 w-[800px] h-[600px] bg-brand-teal/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
         <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
         
         <div className="min-h-full rounded-[2rem] border border-white/5 bg-surface-glass/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
            <div className="relative z-10 p-6 md:p-10">
              <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs font-semibold text-amber-200">
                Development demo · Bundled de-identified and synthetic data · Not for clinical decisions
              </div>
              {children}
            </div>
         </div>
      </main>
    </div>
  );
}
