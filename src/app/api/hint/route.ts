import { NextRequest, NextResponse } from 'next/server';
import { getChallenge } from '@/lib/challenge-store';
import { HintRequest, HintResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HintRequest;
    
    if (!body.challengeId || !body.hintLevel) {
      return NextResponse.json({ error: 'Missing challengeId or hintLevel' }, { status: 400 });
    }

    const challenge = getChallenge(body.challengeId);
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const hint = challenge.hints.find(h => h.level === body.hintLevel);
    if (!hint) {
      return NextResponse.json({ error: 'Hint not found' }, { status: 404 });
    }

    // Calculate remaining XP
    let usedXP = 0;
    for (let i = 0; i < body.hintLevel && i < challenge.hints.length; i++) {
      usedXP += challenge.hints[i].xpCost;
    }
    
    const remainingXP = Math.max(0, challenge.maxXP - usedXP);

    const response: HintResponse = {
      hint: hint,
      remainingXP,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching hint:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch hint' }, { status: 500 });
  }
}
