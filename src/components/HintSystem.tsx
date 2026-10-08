'use client';

import React from 'react';
import { HintLevel } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, MapPin, Compass, Eye, Lock, ChevronRight } from 'lucide-react';

interface HintSystemProps {
  challengeId: string;
  maxXP: number;
  allHints: HintLevel[];
  hintsRevealed: HintLevel[];
  currentHintLevel: number;
  onRevealHint: (hint: HintLevel) => void;
  disabled?: boolean;
}

const HINT_META = [
  { level: 1, icon: <Lightbulb size={14} />, label: 'Concept' },
  { level: 2, icon: <MapPin size={14} />, label: 'Location' },
  { level: 3, icon: <Compass size={14} />, label: 'Direction' },
  { level: 4, icon: <Eye size={14} />, label: 'Answer' },
];

export default function HintSystem({
  maxXP,
  allHints,
  hintsRevealed,
  currentHintLevel,
  onRevealHint,
  disabled = false,
}: HintSystemProps) {
  const revealedLevels = new Set(hintsRevealed.map((h) => h.level));

  const handleReveal = (hintLevel: number) => {
    if (disabled) return;
    const hint = allHints.find((h) => h.level === hintLevel);
    if (hint) {
      onRevealHint(hint);
    }
  };

  const hintCost = (level: number) =>
    level < 4 ? Math.round(maxXP * 0.2) : Math.round(maxXP * 0.3);

  return (
    <div className="saas-panel border-zinc-800 flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
          <Lightbulb size={12} className="text-yellow-500" /> Assistant
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">Cost deducted from XP</span>
      </div>

      <div className="flex flex-col p-2 gap-1 bg-zinc-950/50">
        {HINT_META.map((meta, index) => {
          const isRevealed = revealedLevels.has(meta.level);
          const isNextAvailable = index === currentHintLevel && !disabled;
          const isLocked = index > currentHintLevel;
          const revealedHint = hintsRevealed.find((h) => h.level === meta.level);

          return (
            <div key={meta.level} className="flex flex-col">
              <AnimatePresence mode="wait">
                {isRevealed && revealedHint ? (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 text-xs bg-indigo-500/10 border border-indigo-500/20 rounded-md my-1"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5 text-indigo-400 font-semibold uppercase tracking-wide text-[10px]">
                      {meta.icon} {meta.label}
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{revealedHint.text}</p>
                  </motion.div>
                ) : (
                  <button
                    key="locked"
                    onClick={() => isNextAvailable && handleReveal(meta.level)}
                    disabled={!isNextAvailable}
                    className={`flex items-center justify-between p-2.5 rounded-md text-xs transition-colors group ${
                      isNextAvailable
                        ? 'hover:bg-zinc-800 text-zinc-300 cursor-pointer'
                        : 'text-zinc-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isLocked ? <Lock size={12} /> : <ChevronRight size={12} className="group-hover:text-indigo-400 transition-colors" />}
                      <span className={isNextAvailable ? 'font-medium' : ''}>{meta.label}</span>
                    </div>
                    {!isRevealed && (
                      <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                        -{hintCost(meta.level)}
                      </span>
                    )}
                  </button>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
