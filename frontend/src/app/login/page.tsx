"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Activity, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const message = await login(username.trim(), password);
    if (message) {
      setError(message);
      setPassword('');
    }
    setSubmitting(false);
  };

  const field = 'w-full rounded-xl border border-border-glass bg-black/40 px-4 py-3 text-white placeholder-white/25 outline-none focus:border-brand-teal';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
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
          <p className="text-slate-400 mt-2 text-center">Sign in to continue. Demo accounts are listed in the README.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
          <label className="block text-sm font-medium text-slate-300">
            Username
            <input
              name="username"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={`${field} mt-2`}
              placeholder="admin, doctor or billing"
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${field} mt-2`}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-teal/90 disabled:opacity-60 text-white font-medium p-4 rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
