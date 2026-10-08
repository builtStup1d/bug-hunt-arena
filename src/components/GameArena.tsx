'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Difficulty, Concept, ClientChallenge } from '@/lib/types';
import StatsBar from './StatsBar';
import DifficultySelector from './DifficultySelector';
import BugReport from './BugReport';
import Timer from './Timer';
import CodeEditor from './CodeEditor';
import HintSystem from './HintSystem';
import ResultScreen from './ResultScreen';
import { Bug, Play, Loader2, AlertCircle, Clock } from 'lucide-react';

export default function GameArena() {
  const {
    phase, stats, challenge, userCode, hintsRevealed, runResult,
    timeRemaining, timerActive,
    loadStats, updateStats, resetGame, setPhase, setChallenge, setUserCode,
    addHint, setRunResult, setTimeRemaining, setTimerActive,
  } = useGameStore();

  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [concept, setConcept] = useState<Concept | 'random'>('random');
  const [running, setRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Timer tick (drives countdown in GameArena, not Timer component) ──
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeRemaining(
        // Read current value via functional update pattern is not available here,
        // so we use the store value directly — the store subscriber will re-render
        useGameStore.getState().timeRemaining - 1
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, setTimeRemaining]);

  // ── Elapsed time counter ──
  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  // ── Auto-trigger timeout when timer hits 0 ──
  useEffect(() => {
    if (timerActive && timeRemaining <= 0) {
      setTimerActive(false);
      setPhase('timeout');
    }
  }, [timeRemaining, timerActive, setTimerActive, setPhase]);

  const startChallenge = async () => {
    setLoadError(null);
    setPhase('loading');
    try {
      const res = await fetch(`/api/challenge?difficulty=${difficulty}&concept=${concept}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate challenge');
      }

      // API returns ClientChallenge directly (not wrapped)
      const clientChallenge: ClientChallenge = data;
      setChallenge(clientChallenge);
      setUserCode(clientChallenge.buggyCode);
      setTimeRemaining(clientChallenge.timeLimit);
      setElapsedTime(0);
      setPhase('playing');
      setTimerActive(true);
    } catch (e: any) {
      console.error(e);
      setLoadError(e.message || 'Failed to load challenge. Please try again.');
      setPhase('menu');
    }
  };

  const runCode = async () => {
    if (!challenge || running) return;
    setRunning(true);
    setTimerActive(false);

    try {
      // Ensure Pyodide is loaded
      let pyodide = (window as any).pyodideInstance;
      if (!pyodide) {
        if (!(window as any).loadPyodide) {
          throw new Error('Pyodide script not loaded yet. Please wait a moment and try again.');
        }
        pyodide = await (window as any).loadPyodide();
        (window as any).pyodideInstance = pyodide;
      }

      const testResults = [];
      let testsPassed = 0;
      const testsTotal = challenge.tests.length;

      for (const tc of challenge.tests) {
        const script = `
${userCode}

import json

def __run_test():
    try:
        res = ${challenge.functionName}(${tc.input})
        if isinstance(res, bool): return str(res).lower()
        if isinstance(res, str): return res
        if res is None: return "None"
        return json.dumps(res, separators=(', ', ': '))
    except Exception as e:
        return "RUNTIME_ERROR: " + str(e)

__run_test()
`;
        let actual = '';
        let errorStr = undefined;
        let passed = false;

        try {
          // Execute in an isolated dictionary namespace so tests don't pollute each other
          const namespace = pyodide.globals.get("dict")();
          actual = await pyodide.runPythonAsync(script, { globals: namespace });
          namespace.destroy();

          const expected = tc.expected.trim();
          passed = actual === expected || actual === `"${expected}"` || `"${actual}"` === expected;
          
          if (actual && actual.startsWith("RUNTIME_ERROR:")) {
            errorStr = actual;
            passed = false;
          }
        } catch (err: any) {
          const fullMsg = err.message || String(err);
          // Extract the last meaningful line (e.g., "SyntaxError: invalid syntax")
          const lines = fullMsg.split('\n').filter((l: string) => l.trim());
          const lastLine = lines[lines.length - 1] || fullMsg;
          errorStr = lastLine.trim();
          actual = errorStr;
        }

        if (passed) testsPassed++;

        testResults.push({
          passed,
          description: tc.description,
          expected: tc.expected,
          actual: String(actual),
          error: errorStr,
        });
      }

      const success = testsPassed === testsTotal && testsTotal > 0;
      
      // Calculate XP locally
      let xpEarned = 0;
      if (success) {
        let hintCosts = 0;
        for (let i = 0; i < hintsRevealed.length; i++) {
          hintCosts += hintsRevealed[i].xpCost;
        }
        xpEarned = Math.max(0, challenge.maxXP - hintCosts);
        if (elapsedTime > 0 && elapsedTime < challenge.timeLimit / 2) {
          xpEarned = Math.round(xpEarned * 1.2);
        }
      }

      const result = {
        success,
        testsPassed,
        testsTotal,
        testResults,
        xpEarned,
        hintsUsed: hintsRevealed.length,
        message: success ? 'BUG SQUASHED!' : 'Some tests failed.',
      };

      setRunResult(result);
      if (success) {
        updateStats(result);
        setPhase('success');
      } else {
        setPhase('failure');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Browser execution error: ${e.message}`);
      setTimerActive(true);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatsBar stats={stats} />

      <main className="flex-1 overflow-hidden flex flex-col relative">
        {/* ── MENU ── */}
        {phase === 'menu' && (
          <div className="flex flex-col items-center justify-center flex-1 p-6 overflow-y-auto">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                <Bug size={32} className="text-indigo-400" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-4 tracking-tight">
                New Debugging Session
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                Configure your environment. The AI will generate a broken codebase matching your parameters. Find the bug, fix it, and deploy before time runs out.
              </p>
            </div>

            {loadError && (
              <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md w-full max-w-xl text-sm shadow-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{loadError}</span>
              </div>
            )}

            <DifficultySelector
              selectedDifficulty={difficulty}
              selectedConcept={concept}
              onDifficultyChange={setDifficulty}
              onConceptChange={setConcept}
            />

            <div className="mt-8 flex justify-center">
              <button
                onClick={startChallenge}
                className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              >
                <Play size={18} fill="currentColor" />
                Initialize Environment
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.2)]"></div>
            <div className="text-center">
              <h2 className="text-lg font-medium text-zinc-200 mb-1">Provisioning Workspace...</h2>
              <p className="text-xs text-zinc-500 font-mono">Generating isolated bug scenario</p>
            </div>
          </div>
        )}

        {/* ── PLAYING / FAILURE ── */}
        {(phase === 'playing' || phase === 'failure') && challenge && (
          <div className="flex flex-col lg:flex-row h-full overflow-hidden">
            {/* Left Sidebar (Context) */}
            <div className="w-full lg:w-[320px] xl:w-[380px] border-r border-zinc-800 flex flex-col bg-zinc-950 overflow-y-auto shrink-0">
              <div className="p-4 flex-1 flex flex-col gap-4">
                <BugReport challenge={challenge} />
                <HintSystem
                  challengeId={challenge.id}
                  maxXP={challenge.maxXP}
                  allHints={challenge.hints}
                  hintsRevealed={hintsRevealed}
                  currentHintLevel={hintsRevealed.length}
                  onRevealHint={addHint}
                  disabled={running || phase !== 'playing'}
                />
              </div>
            </div>

            {/* Right Pane (IDE) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
              {/* Editor Toolbar */}
              <div className="h-12 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    main.py
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Timer timeRemaining={timeRemaining} totalTime={challenge.timeLimit} />
                  
                  <button
                    onClick={runCode}
                    disabled={running || phase !== 'playing'}
                    className="btn-success py-1.5 px-4 text-xs flex items-center gap-1.5 shadow-none hover:shadow-none"
                  >
                    {running ? (
                      <><Loader2 size={12} className="animate-spin" /> Executing...</>
                    ) : (
                      <><Play size={12} fill="currentColor" /> Run Tests</>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 relative min-h-0">
                <CodeEditor
                  code={userCode}
                  onChange={setUserCode}
                  language="python"
                  readOnly={running || phase !== 'playing'}
                  height="100%"
                />
              </div>

              {/* Bottom Console (Results) */}
              {phase === 'failure' && runResult && (
                <div className="h-2/5 min-h-[250px] border-t border-zinc-800 bg-zinc-950 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-10">
                  <ResultScreen
                    result={runResult}
                    challenge={challenge}
                    timeElapsed={elapsedTime}
                    onNextChallenge={resetGame}
                    onRetry={() => {
                      setPhase('playing');
                      setTimerActive(true);
                      setRunResult(null);
                    }}
                    stats={stats}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUCCESS MODAL ── */}
        {phase === 'success' && challenge && runResult && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl shadow-2xl">
              <ResultScreen
                result={runResult}
                challenge={challenge}
                timeElapsed={elapsedTime}
                onNextChallenge={resetGame}
                onRetry={resetGame}
                stats={stats}
              />
            </div>
          </div>
        )}

        {/* ── TIMEOUT MODAL ── */}
        {phase === 'timeout' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <div className="saas-panel p-8 flex flex-col items-center text-center max-w-md w-full border-red-500/20 shadow-2xl shadow-red-500/10">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">Time Expired</h2>
              <p className="text-sm text-zinc-400 mb-8">
                The session timed out before the tests could pass. Review the code and try again.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    if (challenge) setTimeRemaining(challenge.timeLimit);
                    setPhase('playing');
                    setTimerActive(true);
                  }}
                  className="btn-primary flex-1 py-2.5"
                >
                  Retry Session
                </button>
                <button onClick={resetGame} className="btn-secondary flex-1 py-2.5">
                  Exit to Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
