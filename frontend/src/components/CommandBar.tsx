import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';

type CommandBarProps = {
  onQuery: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
  /** Pre-fills the input only; never auto-submitted. */
  initialQuery?: string;
};

const DEFAULT_PLACEHOLDER =
  "Ask about historical encounters... e.g., 'How many encounters were readmitted within 30 days?'";

const CommandBar = ({ onQuery, isLoading, placeholder, initialQuery = '' }: CommandBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    onQuery(query);
    setQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="w-full mt-10 mb-8"
    >
      <form onSubmit={handleSubmit} className={`relative flex items-center w-full transition-all duration-300 ${isFocused ? 'ring-2 ring-brand-teal shadow-[0_0_15px_rgba(13,148,136,0.3)] rounded-2xl' : ''}`}>
        <div className="absolute left-4 p-2 bg-brand-teal/10 rounded-full">
          <Sparkles className="w-5 h-5 text-brand-teal" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isLoading}
          placeholder={placeholder || DEFAULT_PLACEHOLDER}
          className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-16 text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm focus:shadow-md disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-4 p-2 bg-brand-teal text-white rounded-xl hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-brand-teal transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </motion.div>
  );
};

export default CommandBar;
