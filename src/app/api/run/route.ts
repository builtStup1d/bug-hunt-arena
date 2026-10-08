import { NextRequest, NextResponse } from 'next/server';
import { getChallenge } from '@/lib/challenge-store';
import { executeCode } from '@/lib/judge0';
import { RunRequest, RunResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RunRequest;
    
    if (!body.challengeId || !body.code) {
      return NextResponse.json({ error: 'Missing challengeId or code' }, { status: 400 });
    }

    const challenge = getChallenge(body.challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const timeSpent = body.timeSpent || 0;
    const hintsUsed = body.hintsUsed || 0;

    const testResults = await executeCode(body.code, challenge.tests, challenge.functionName);
    
    const testsPassed = testResults.filter(r => r.passed).length;
    const testsTotal = testResults.length;
    const success = testsPassed === testsTotal && testsTotal > 0;

    let xpEarned = 0;
    if (success) {
      // Base XP is calculated by subtracting costs of used hints
      let hintCosts = 0;
      for (let i = 0; i < hintsUsed && i < challenge.hints.length; i++) {
        hintCosts += challenge.hints[i].xpCost;
      }
      
      xpEarned = Math.max(0, challenge.maxXP - hintCosts);
      
      // Time bonus
      if (timeSpent > 0 && timeSpent < challenge.timeLimit / 2) {
        xpEarned = Math.round(xpEarned * 1.2);
      }
    }

    const runResult: RunResult = {
      success,
      testsPassed,
      testsTotal,
      testResults,
      xpEarned,
      hintsUsed,
      message: success ? 'BUG SQUASHED!' : 'Some tests failed.',
    };

    return NextResponse.json({ result: runResult });
  } catch (error: any) {
    console.error('Error running code:', error);
    return NextResponse.json({ error: error.message || 'Failed to run code' }, { status: 500 });
  }
}
