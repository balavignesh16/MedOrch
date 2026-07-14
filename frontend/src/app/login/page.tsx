"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('medorch_token', data.token);
      router.push('/');
    } catch (err) {
      setError('Invalid username or password. (Hint: use admin / password)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative z-50">
      <div className="absolute inset-0 bg-slate-950 z-[-1]" />
      
      <div className="glass-card w-full max-w-md p-10 rounded-3xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand-teal/20 blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col items-center mb-10 relative z-10">
          <div className="p-3 bg-brand-teal/20 rounded-2xl mb-4 border border-brand-teal/30">
            <Activity className="w-10 h-10 text-brand-teal" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-brand-teal to-brand-indigo">MedOrch</h1>
          <p className="text-slate-400 mt-2 font-medium">Enterprise AI Copilot</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          {error && (
            <div className="p-3 bg-brand-rose/10 border border-brand-rose/30 text-brand-rose text-sm rounded-xl text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Admin Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-brand-teal/50 transition-all"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-brand-teal/50 transition-all"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full py-3 bg-brand-teal hover:bg-teal-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50 flex justify-center"
          >
            {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
