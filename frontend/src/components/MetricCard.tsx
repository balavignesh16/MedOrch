"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, isPositive, icon: Icon }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-surface-glass border border-border-glass backdrop-blur-md rounded-xl p-6 shadow-lg"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-400 font-medium">{title}</h3>
        <div className="p-2 bg-slate-800/50 rounded-lg">
          <Icon className="w-5 h-5 text-brand-teal" />
        </div>
      </div>
      
      <div className="flex items-end space-x-3">
        <span className="text-4xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`text-sm font-medium mb-1 ${isPositive ? 'text-brand-teal' : 'text-brand-orange'}`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default MetricCard;
