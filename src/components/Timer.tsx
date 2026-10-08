'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export default function Timer({ timeRemaining, totalTime }: TimerProps) {
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const percentage = totalTime > 0 ? Math.max(0, (timeRemaining / totalTime) * 100) : 0;
  const isUrgent = timeRemaining <= 15 && timeRemaining > 0;

  let colorClass = 'text-emerald-400';
  let bgClass = 'bg-emerald-400';
  if (percentage <= 50 && percentage > 25) {
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-400';
  }
  if (percentage <= 25) {
    colorClass = 'text-red-400';
    bgClass = 'bg-red-400';
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 ${isUrgent ? 'animate-pulse border-red-500/30' : ''}`}>
      <Clock size={12} className={colorClass} />
      <span className={`font-mono text-xs font-semibold tracking-wider ${colorClass}`}>
        {formatTime(timeRemaining)}
      </span>
      {/* Mini Progress Bar */}
      <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden ml-1 hidden sm:block">
        <motion.div
          className={`h-full ${bgClass}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </div>
  );
}
