'use client';

import React from 'react';
import { Difficulty, Concept } from '@/lib/types';
import { Settings2, Zap } from 'lucide-react';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  selectedConcept: Concept | 'random';
  onDifficultyChange: (d: Difficulty) => void;
  onConceptChange: (c: Concept | 'random') => void;
}

const DIFFICULTIES: { val: Difficulty; label: string; desc: string }[] = [
  { val: 1, label: 'Rookie', desc: 'Basic logic' },
  { val: 2, label: 'Apprentice', desc: 'Control flow' },
  { val: 3, label: 'Hunter', desc: 'Data structures' },
  { val: 4, label: 'Expert', desc: 'Complex algorithms' },
  { val: 5, label: 'Legend', desc: 'Hardcore debugging' },
];

const CONCEPTS: Record<string, Concept[]> = {
  'Beginner': ['variables', 'if-statements', 'loops', 'lists', 'functions', 'strings'],
  'Intermediate': ['recursion', 'dictionaries', 'exceptions', 'classes', 'list-comprehensions', 'sorting'],
  'Advanced': ['generators', 'decorators', 'regex', 'data-structures', 'algorithms', 'math'],
};

export default function DifficultySelector({
  selectedDifficulty,
  selectedConcept,
  onDifficultyChange,
  onConceptChange,
}: DifficultySelectorProps) {
  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Configuration Form */}
      <div className="saas-panel p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
          <Settings2 size={18} className="text-zinc-400" />
          <h2 className="text-sm font-medium text-zinc-200">Session Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* Difficulty Segmented Control */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Threat Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.val}
                  onClick={() => onDifficultyChange(d.val)}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium border transition-all ${
                    selectedDifficulty === d.val
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className="mb-0.5">{d.label}</span>
                  <div className="flex gap-0.5 opacity-60">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-1 rounded-full ${i < d.val ? 'bg-current' : 'bg-zinc-700'}`} 
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Concept Select */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
              Target Concept
            </label>
            <div className="relative saas-focus rounded-md">
              <select
                value={selectedConcept}
                onChange={(e) => onConceptChange(e.target.value as Concept | 'random')}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-2.5 px-3 text-sm text-zinc-200 focus:outline-none appearance-none"
              >
                <option value="random">Randomize (Surprise Me)</option>
                {Object.entries(CONCEPTS).map(([group, concepts]) => (
                  <optgroup key={group} label={group} className="text-zinc-500">
                    {concepts.map((c) => (
                      <option key={c} value={c} className="text-zinc-200">
                        {c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
