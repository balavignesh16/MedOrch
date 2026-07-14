"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlobalCommandMenu from '@/components/GlobalCommandMenu';
import { AnimatePresence, motion } from 'framer-motion';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('medorch_token');
    
    if (!token && pathname !== '/login') {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return <div className="h-screen w-screen bg-[#0b1120] flex items-center justify-center" />;
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-10 no-scrollbar relative z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <GlobalCommandMenu />
    </>
  );
}
