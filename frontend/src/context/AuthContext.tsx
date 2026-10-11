"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { safeNextPath } from '@/lib/auth/access';

export type Role = 'admin' | 'doctor' | 'billing';

export interface AuthUser {
  username: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  /** Resolves to an error message, or null on success. */
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

interface ServerUser {
  username: string;
  displayName: string;
  role: Role;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toAuthUser = (user: ServerUser): AuthUser => ({ username: user.username, name: user.displayName, role: user.role });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // The signed, HTTP-only cookie is the only source of truth; nothing about the user is stored in the browser.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => (response.ok ? (response.json() as Promise<{ user: ServerUser }>) : null))
      .then((data) => {
        if (cancelled) return;
        setUser(data ? toAuthUser(data.user) : null);
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user && pathname !== '/login') router.push('/login');
  }, [user, isLoading, pathname, router]);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const body = (await response.json().catch(() => null)) as { user?: ServerUser; error?: { message?: string } } | null;
      if (!response.ok || !body?.user) return body?.error?.message ?? 'Sign-in failed. Please try again.';
      setUser(toAuthUser(body.user));
      router.push(safeNextPath(new URLSearchParams(window.location.search).get('next')));
      router.refresh();
      return null;
    } catch {
      return 'The server could not be reached.';
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>;
  }

  if (!user && pathname !== '/login') return null;

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
