import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

interface CommandBarProps {
  onQuerySubmit: (query: string) => void;
  isLoading?: boolean;
}

const CommandBar = ({ onQuerySubmit, isLoading = false }: CommandBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    onQuerySubmit(query);
    setQuery('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="w-full mt-10 mb-4"
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
          placeholder="Ask MedOrch AI... e.g., 'What is the readmission risk if ICU capacity reaches 90%?'"
          className="w-full bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl py-5 pl-14 pr-16 text-foreground placeholder-slate-500 outline-none transition-colors focus:bg-surface-glass-hover"
        />
        
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="absolute right-4 p-2 bg-brand-teal text-white rounded-xl hover:bg-teal-500 disabled:opacity-50 disabled:hover:bg-brand-teal transition-colors"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CommandBar;
