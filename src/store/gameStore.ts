'use client';
import { create } from 'zustand';
import { GameState, PlayerStats, RunResult, HintLevel, ClientChallenge, Difficulty, Concept } from '@/lib/types';

const defaultStats: PlayerStats = {
  totalXP: 0,
  level: 1,
  bugsSquashed: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayedDate: '',
  perfectSolves: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  challenge: null,
  userCode: '',
  hintsRevealed: [],
  currentHintLevel: 0,
  runResult: null,
  timeRemaining: 0,
  timerActive: false,
  isRunning: false,
  
  stats: defaultStats,
  selectedDifficulty: 1,
  selectedConcept: 'random',
  
  loadStats: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bugHuntStats');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          set({ stats: { ...defaultStats, ...parsed } });
        } catch (e) {
          set({ stats: defaultStats });
        }
      } else {
        set({ stats: defaultStats });
      }
    }
  },
  
  updateStats: (result: RunResult) => {
    if (result.success) {
      set((state) => {
        const stats = { ...state.stats };
        
        // Date logic for streak
        const today = new Date().toISOString().split('T')[0];
        const lastPlayed = stats.lastPlayedDate;
        if (lastPlayed) {
          const lastDate = new Date(lastPlayed);
          const todayDate = new Date(today);
          const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          
          if (diff === 1) {
            stats.currentStreak += 1;
          } else if (diff > 1) {
            stats.currentStreak = 1;
          }
        } else {
          stats.currentStreak = 1;
        }
        
        stats.lastPlayedDate = today;
        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
        
        stats.bugsSquashed += 1;
        stats.totalXP += result.xpEarned || 0;
        stats.level = Math.floor(stats.totalXP / 500) + 1;
        
        if (state.hintsRevealed.length === 0) {
          stats.perfectSolves += 1;
        }
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('bugHuntStats', JSON.stringify(stats));
        }
        
        return { stats };
      });
    }
  },
  
  resetGame: () => {
    set({
      phase: 'menu',
      challenge: null,
      userCode: '',
      hintsRevealed: [],
      currentHintLevel: 0,
      runResult: null,
      timeRemaining: 0,
      timerActive: false,
      isRunning: false,
    });
  },
  
  setPhase: (phase) => set({ phase }),
  setChallenge: (challenge) => set({ challenge }),
  setUserCode: (userCode) => set({ userCode }),
  addHint: (hint) => set((state) => ({ 
    hintsRevealed: [...state.hintsRevealed, hint],
    currentHintLevel: state.currentHintLevel + 1
  })),
  setRunResult: (runResult) => set({ runResult }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setTimerActive: (timerActive) => set({ timerActive }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setSelectedDifficulty: (d) => set({ selectedDifficulty: d }),
  setSelectedConcept: (c) => set({ selectedConcept: c }),
}));
