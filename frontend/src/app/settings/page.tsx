import React from 'react';
import { Settings, User, Bell, Shield, Database, Layout } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Settings</h2>
        <p className="text-slate-400 mt-2">Manage your profile, hospital preferences, and system integrations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-brand-teal/10 text-brand-teal rounded-xl text-sm font-medium transition-colors">
            <User className="w-5 h-5" /> Profile & Account
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            <Layout className="w-5 h-5" /> Hospital Preferences
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            <Shield className="w-5 h-5" /> Security & Roles
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-slate-300 rounded-xl text-sm font-medium transition-colors">
            <Database className="w-5 h-5" /> Data & Integrations
          </button>
        </div>

        <div className="col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-teal" /> Personal Information
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">First Name</label>
                  <input type="text" defaultValue="Admin" className="w-full bg-white/5 border border-border-glass rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-400">Last Name</label>
                  <input type="text" defaultValue="User" className="w-full bg-white/5 border border-border-glass rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Email Address</label>
                <input type="email" defaultValue="admin@medorch.hospital.com" className="w-full bg-white/5 border border-border-glass rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-teal" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Role / Title</label>
                <input type="text" defaultValue="Chief Medical Officer" disabled className="w-full bg-white/5 border border-border-glass rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed" />
              </div>
              <div className="pt-4">
                <button className="bg-brand-teal text-background font-semibold px-6 py-2 rounded-lg hover:bg-brand-teal/90 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Hospital Preferences */}
          <div className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Layout className="w-5 h-5 text-brand-blue" /> Application Preferences
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Dark Mode</p>
                  <p className="text-sm text-slate-500">Toggle dark mode theme for the dashboard.</p>
                </div>
                <div className="w-12 h-6 bg-brand-teal rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">High Contrast Mode</p>
                  <p className="text-sm text-slate-500">Increase UI contrast for better readability.</p>
                </div>
                <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
