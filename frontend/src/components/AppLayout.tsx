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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="min-h-full rounded-2xl border border-border-glass bg-surface-glass backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] relative">
           {/* Glow Effects */}
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
           <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
           
           <div className="relative z-10 p-4 md:p-8">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
}
