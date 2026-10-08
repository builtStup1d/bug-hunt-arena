'use client';

import React from 'react';
import { PlayerStats } from '@/lib/types';
import { Bug, Flame, Trophy } from 'lucide-react';

interface StatsBarProps {
  stats: PlayerStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const currentXP = stats.totalXP % 500;
  const progressPercent = (currentXP / 500) * 100;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Bug size={18} className="text-indigo-500" />
          <span className="font-semibold text-zinc-100 tracking-tight text-sm">
            Bug Hunt Arena
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2 text-zinc-400">
            <Trophy size={14} className="text-emerald-500" />
            <span className="text-zinc-200">{stats.bugsSquashed}</span>
            <span className="hidden sm:inline">Squashed</span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <Flame size={14} className="text-orange-500" />
            <span className="text-zinc-200">{stats.currentStreak}</span>
            <span className="hidden sm:inline">Streak</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-zinc-200 flex items-center gap-1">
              <span className="text-xs text-zinc-500 uppercase">Lvl</span>
              {stats.level}
            </div>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            <span className="text-xs text-zinc-500 font-mono hidden sm:inline">{currentXP}/500</span>
          </div>
        </div>
      </div>
    </header>
  );
}
