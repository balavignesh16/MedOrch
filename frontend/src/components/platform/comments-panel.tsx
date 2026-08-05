import React from 'react';
import { MessageSquare, Send, User } from 'lucide-react';

export function CommentsPanel() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[300px]">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand-teal" />
        <h3 className="font-semibold text-white">Collaboration</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl rounded-tl-none p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">Dr. Sarah Chen</span>
              <span className="text-[10px] text-white/40">10m ago</span>
            </div>
            <p className="text-sm text-white/80">Could we get a drill-down on the Q3 operational costs for the ER?</p>
          </div>
        </div>
        <div className="flex items-start gap-3 flex-row-reverse">
           <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-teal">ME</span>
          </div>
          <div className="flex-1 bg-brand-teal/10 rounded-2xl rounded-tr-none p-3">
             <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">You</span>
              <span className="text-[10px] text-white/40">Just now</span>
            </div>
            <p className="text-sm text-white/80">I will generate a report for that and add it to your workspace.</p>
          </div>
        </div>
      </div>
      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        <input 
          type="text"
          placeholder="Type a message or @mention..."
          className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-teal/50 transition-colors"
        />
        <button className="w-9 h-9 rounded-xl bg-brand-teal text-black flex items-center justify-center hover:bg-brand-teal/90 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
