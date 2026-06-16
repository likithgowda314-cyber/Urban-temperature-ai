import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function ConfidenceBadge({ level }) {
  const cn = (...args) => twMerge(clsx(...args));
  
  if (!level) return null;
  
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm', colors[level.toLowerCase()] || 'bg-slate-100 text-slate-800')}>
      {level}
    </span>
  );
}
