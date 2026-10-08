'use client';

import React from 'react';
import { ClientChallenge } from '@/lib/types';
import { AlertCircle, Clock, Hash, Tag, User } from 'lucide-react';

interface BugReportProps {
  challenge: ClientChallenge;
}

export default function BugReport({ challenge }: BugReportProps) {
  const shortId = challenge.id.slice(0, 7).toUpperCase();

  const difficultyColors = [
    '', 
    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 
    'bg-blue-500/10 text-blue-400 border-blue-500/20', 
    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
    'bg-orange-500/10 text-orange-400 border-orange-500/20', 
    'bg-red-500/10 text-red-400 border-red-500/20',
  ];
  const difficultyLabel = ['', 'Rookie', 'Apprentice', 'Hunter', 'Expert', 'Legend'][challenge.difficulty] ?? '';

  return (
    <div className="saas-panel overflow-hidden flex flex-col h-full border-zinc-800">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-900/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Hash size={12} />
            <span>ISSUE-{shortId}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${difficultyColors[challenge.difficulty]}`}>
            {difficultyLabel}
          </div>
        </div>
        
        <h2 className="text-base font-semibold text-zinc-100 leading-snug">
          {challenge.title}
        </h2>
      </div>

      {/* Description / Content */}
      <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
        
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
            <User size={14} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-zinc-400 mb-1">
              Reported by <span className="text-zinc-200">{challenge.customerName}</span>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-900 border border-zinc-800 p-3 rounded-md shadow-inner">
              "{challenge.complaint}"
            </div>
          </div>
        </div>

        {challenge.description && (
          <div className="text-sm text-zinc-400 leading-relaxed">
            {challenge.description}
          </div>
        )}
      </div>

      {/* Metadata Footer */}
      <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/50 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50">
          <Tag size={12} />
          <span className="capitalize">{challenge.concept.replace(/-/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50">
          <Clock size={12} />
          <span className="font-mono">{Math.floor(challenge.timeLimit / 60)}:{(challenge.timeLimit % 60).toString().padStart(2, '0')} limit</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded border border-zinc-700/50 ml-auto">
          <AlertCircle size={12} className="text-indigo-400" />
          <span className="font-mono">{challenge.maxXP} XP</span>
        </div>
      </div>
    </div>
  );
}
