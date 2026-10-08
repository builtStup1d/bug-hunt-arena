'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RunResult, ClientChallenge, PlayerStats } from '@/lib/types';
import { CheckCircle2, XCircle, Trophy, Clock, Zap, Target } from 'lucide-react';

interface ResultScreenProps {
  result: RunResult;
  challenge: ClientChallenge;
  timeElapsed: number;
  onNextChallenge: () => void;
  onRetry: () => void;
  stats: PlayerStats;
}

export default function ResultScreen({
  result,
  challenge,
  timeElapsed,
  onNextChallenge,
  onRetry,
  stats,
}: ResultScreenProps) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (result.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full saas-panel border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col items-center text-center"
      >
        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
          <CheckCircle2 size={24} className="text-emerald-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-emerald-400 mb-1">Issue Resolved</h2>
        <p className="text-sm text-zinc-400 mb-6">All test cases passed successfully.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6">
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
            <Trophy className="text-yellow-500 mb-1" size={16} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">XP Earned</span>
            <span className="text-lg font-mono text-zinc-200">+{result.xpEarned}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
            <Clock className="text-blue-500 mb-1" size={16} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</span>
            <span className="text-lg font-mono text-zinc-200">{formatTime(timeElapsed)}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
            <Zap className="text-orange-500 mb-1" size={16} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</span>
            <span className="text-lg font-mono text-zinc-200">{stats.currentStreak}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
            <Target className="text-indigo-500 mb-1" size={16} />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Skill</span>
            <span className="text-xs font-semibold text-indigo-400 mt-1 uppercase">{challenge.concept}</span>
          </div>
        </div>

        <button onClick={onNextChallenge} className="btn-success w-full max-w-[200px]">
          Next Issue
        </button>
      </motion.div>
    );
  }

  // Failure view
  const failedTests = result.testResults.filter((t) => !t.passed);
  const firstError = result.testResults.find((t) => t.error)?.error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full saas-panel border-red-500/20 bg-zinc-950 p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-red-400">
          <XCircle size={16} />
          <h2 className="text-sm font-semibold">Test Suite Failed</h2>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          {result.testsPassed}/{result.testsTotal} Passed
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        {/* Error output */}
        {firstError && (
          <div className="bg-red-950/20 border border-red-900/30 rounded-md p-3 font-mono text-xs text-red-400 whitespace-pre-wrap">
            {firstError}
          </div>
        )}

        {/* Failed test details */}
        {failedTests.length > 0 && (
          <div className="space-y-2">
            {failedTests.slice(0, 3).map((t, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3 text-xs">
                <div className="text-zinc-300 font-medium mb-2">{t.description}</div>
                <div className="grid grid-cols-2 gap-2 font-mono bg-zinc-950 p-2 rounded border border-zinc-800/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-600 uppercase">Expected</span>
                    <span className="text-emerald-400/80">{t.expected}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-zinc-600 uppercase">Actual</span>
                    <span className="text-red-400/80">{t.actual}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 mt-4 border-t border-zinc-800">
        <button onClick={onRetry} className="btn-secondary flex-1">
          Review Code
        </button>
        <button onClick={onNextChallenge} className="btn-secondary text-zinc-500 hover:text-zinc-300 flex-1">
          Skip Issue
        </button>
      </div>
    </motion.div>
  );
}
