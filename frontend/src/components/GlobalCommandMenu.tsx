"use client";

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, LayoutDashboard, User, Activity, Bot, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalCommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-surface-glass border border-border-glass shadow-2xl rounded-2xl overflow-hidden"
          >
            <Command className="w-full h-full flex flex-col bg-transparent">
              <div className="flex items-center border-b border-border-glass px-4 py-3">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-400 text-lg"
                  autoFocus
                />
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 font-mono">esc</kbd>
                </div>
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto p-2 no-scrollbar">
                <Command.Empty className="p-6 text-center text-slate-400">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-semibold text-slate-400 px-2 py-2 uppercase tracking-wider">
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push('/'))}
                    className="flex items-center px-4 py-3 text-sm text-slate-200 rounded-xl cursor-pointer aria-selected:bg-brand-teal/20 aria-selected:text-brand-teal transition-colors"
                  >
                    <Bot className="w-4 h-4 mr-3" /> AI Copilot
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push('/dashboard'))}
                    className="flex items-center px-4 py-3 text-sm text-slate-200 rounded-xl cursor-pointer aria-selected:bg-brand-teal/20 aria-selected:text-brand-teal transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-3" /> Command Center
                  </Command.Item>
                  <Command.Item 
                    onSelect={() => runCommand(() => router.push('/patients'))}
                    className="flex items-center px-4 py-3 text-sm text-slate-200 rounded-xl cursor-pointer aria-selected:bg-brand-teal/20 aria-selected:text-brand-teal transition-colors"
                  >
                    <User className="w-4 h-4 mr-3" /> Patient Directory
                  </Command.Item>
                </Command.Group>

                <Command.Group heading="Quick Actions" className="text-xs font-semibold text-slate-400 px-2 pt-4 pb-2 uppercase tracking-wider">
                  <Command.Item 
                    onSelect={() => runCommand(() => {
                      localStorage.removeItem('medorch_token');
                      router.push('/login');
                    })}
                    className="flex items-center px-4 py-3 text-sm text-slate-200 rounded-xl cursor-pointer aria-selected:bg-brand-rose/20 aria-selected:text-brand-rose transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" /> Logout securely
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
