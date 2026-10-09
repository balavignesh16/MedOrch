import React from 'react';
import type { fetchNotifications } from '@/lib/platformLogic';
import { Bell, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Awaited<ReturnType<typeof fetchNotifications>>;
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'Critical': return { icon: <AlertTriangle className="w-4 h-4 text-danger" />, bg: 'bg-danger/10', border: 'border-danger/20' };
      case 'Warning': return { icon: <AlertTriangle className="w-4 h-4 text-warning" />, bg: 'bg-warning/10', border: 'border-warning/20' };
      case 'Info': return { icon: <Info className="w-4 h-4 text-brand-cyan" />, bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/20' };
      case 'Resolved': return { icon: <CheckCircle2 className="w-4 h-4 text-brand-teal" />, bg: 'bg-brand-teal/10', border: 'border-brand-teal/20' };
      default: return { icon: <Bell className="w-4 h-4 text-white/50" />, bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[400px]">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-teal" /> Notification Center
        </h3>
        <span className="text-xs bg-danger text-white font-bold px-2 py-0.5 rounded-full">{notifications.filter(n => !n.read).length} New</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {notifications.map(notif => {
          const style = getLevelStyles(notif.level);
          return (
            <div key={notif.id} className={`p-3 rounded-xl border ${style.border} ${style.bg} ${notif.read ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {style.icon}
                  <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                </div>
                <span className="text-[10px] text-white/50 whitespace-nowrap">{notif.timestamp}</span>
              </div>
              <p className="text-xs text-white/80 mt-2">{notif.message}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">{notif.module}</span>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
