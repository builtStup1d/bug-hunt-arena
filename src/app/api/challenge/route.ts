import { NextRequest, NextResponse } from 'next/server';
import { generateChallenge, getRandomBugType, getRandomConcept } from '@/lib/gemini';
import { storeChallenge } from '@/lib/challenge-store';
import { Difficulty, Concept, ClientChallenge } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const difficultyParam = searchParams.get('difficulty');
    const conceptParam = searchParams.get('concept');

    if (!difficultyParam) {
      return NextResponse.json({ error: 'Missing difficulty parameter' }, { status: 400 });
    }

    const difficulty = parseInt(difficultyParam, 10) as Difficulty;
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      return NextResponse.json({ error: 'Invalid difficulty (must be 1-5)' }, { status: 400 });
    }

    // Pick concept and bug type
    const concept: Concept =
      conceptParam && conceptParam !== 'random'
        ? (conceptParam as Concept)
        : getRandomConcept(difficulty);

    const bugType = getRandomBugType(difficulty);

    // Generate challenge via Gemini AI
    const challenge = await generateChallenge({
      difficulty,
      concept,
      bugType,
      language: 'python',
    });

    // Store full challenge (with secrets) on backend
    storeChallenge(challenge);

    // Return only the client-safe version
    const clientChallenge: ClientChallenge = {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      customerName: challenge.customerName,
      complaint: challenge.complaint,
      buggyCode: challenge.buggyCode,
      language: challenge.language,
      concept: challenge.concept,
      difficulty: challenge.difficulty,
      timeLimit: challenge.timeLimit,
      maxXP: challenge.maxXP,
      hintCount: challenge.hints.length,
      functionName: challenge.functionName,
      tests: challenge.tests,
      hints: challenge.hints,
    };

    return NextResponse.json(clientChallenge);
  } catch (error: any) {
    console.error('Challenge generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
