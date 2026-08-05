"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, isPositive, icon: Icon }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="group bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden transition-all duration-500 hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:border-brand-teal/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`absolute -right-12 -top-12 w-40 h-40 bg-brand-teal/5 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none mix-blend-multiply
          ${isHovered ? 'opacity-100 scale-150' : 'opacity-0 scale-100'}
        `}
      />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3 rounded-2xl transition-colors duration-500 ${isHovered ? 'bg-brand-teal/10 text-brand-teal shadow-inner' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${isHovered ? 'scale-105' : ''} ${isPositive ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-orange/10 text-brand-orange'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">
          {title}
        </p>
        <h4 className="text-3xl font-bold text-slate-900 tracking-tighter">
          {value}
        </h4>
      </div>
    </motion.div>
  );
};

export default MetricCard;
