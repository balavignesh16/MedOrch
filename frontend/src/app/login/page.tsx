"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Activity, User, Stethoscope, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'doctor' | 'billing'>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1), selectedRole);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-teal/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-glass border border-border-glass backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-teal/20 rounded-2xl flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-brand-teal" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MedOrch</h1>
          <p className="text-slate-400 mt-2 text-center">Sign in to access the Clinical Operations AI Orchestrator.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Select your role</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`flex items-center p-4 rounded-xl border transition-all ${selectedRole === 'admin' ? 'bg-brand-teal/10 border-brand-teal text-white' : 'border-border-glass text-slate-400 hover:bg-white/5'}`}
              >
                <User className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Hospital Administrator</div>
                  <div className="text-xs opacity-70">Full system access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('doctor')}
                className={`flex items-center p-4 rounded-xl border transition-all ${selectedRole === 'doctor' ? 'bg-brand-teal/10 border-brand-teal text-white' : 'border-border-glass text-slate-400 hover:bg-white/5'}`}
              >
                <Stethoscope className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Attending Physician</div>
                  <div className="text-xs opacity-70">Clinical & Navigation agents</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('billing')}
                className={`flex items-center p-4 rounded-xl border transition-all ${selectedRole === 'billing' ? 'bg-brand-teal/10 border-brand-teal text-white' : 'border-border-glass text-slate-400 hover:bg-white/5'}`}
              >
                <Briefcase className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Billing Specialist</div>
                  <div className="text-xs opacity-70">Financial & Claims agents</div>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-medium p-4 rounded-xl transition-colors"
          >
            Sign In Securely
          </button>
        </form>
      </motion.div>
    </div>
  );
}
