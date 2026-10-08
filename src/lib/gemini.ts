import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  Challenge,
  GenerationContext,
  Difficulty,
  BugType,
  Concept,
  BeginnerConcept,
  IntermediateConcept,
  AdvancedConcept,
  HintLevel,
} from '@/lib/types';

const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Try models in order of preference until one works
const MODEL_FALLBACKS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

/**
 * Generate a complete debugging challenge using Gemini AI.
 * Uses controlled prompting to ensure exactly one bug with test validation.
 * Falls back through model versions on 503/404 errors.
 */
export async function generateChallenge(context: GenerationContext): Promise<Challenge> {
  const prompt = buildPrompt(context);

  let lastError: any;

  for (const modelName of MODEL_FALLBACKS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });

    // Retry same model up to 2 times for transient 503s
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Trying model ${modelName} (attempt ${attempt})...`);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        return buildChallenge(parsed, context);
      } catch (err: any) {
        lastError = err;
        const statusCode =
          err?.status ??
          err?.statusCode ??
          (typeof err?.message === 'string' && err.message.match(/\[(\d+)\s/)?.[1]);

        const code = Number(statusCode);

        if (code === 503 && attempt < 2) {
          // Transient overload — wait and retry same model
          console.warn(`${modelName} 503 (attempt ${attempt}), retrying in 3s...`);
          await sleep(3000);
          continue;
        } else if (code === 404 || code === 400) {
          // Model doesn't exist or is unavailable — try next one
          console.warn(`${modelName} returned ${code}, trying next model...`);
          break;
        } else if (code === 503) {
          // Still 503 after retry — try next model
          console.warn(`${modelName} still 503, trying next model...`);
          break;
        } else {
          // Unknown error — propagate
          throw err;
        }
      }
    }
  }

  throw new Error(
    `All Gemini models failed. Last error: ${lastError?.message ?? String(lastError)}`
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildPrompt(context: GenerationContext): string {
  return `
You are generating a Python debugging challenge for a gamified debugging platform called "Bug Hunt Arena".

CONTEXT:
- Difficulty: ${context.difficulty}/5
- Programming Concept: ${context.concept}
- Bug Type to Inject: ${context.bugType}

RULES — follow these EXACTLY:
1. Write a CORRECT, working Python function for the given concept and difficulty.
2. Introduce EXACTLY ONE bug of type "${context.bugType}" into the function.
3. The bug MUST cause at least one test case to fail.
4. The fix should require changing only 1-3 lines of code.
5. Generate 4-6 test cases that EXPOSE the bug (at least one must fail with the buggy code).
6. Create a fun "bug report" scenario — a fictional customer name and their complaint describing the OBSERVABLE SYMPTOM (not the technical cause).
7. Generate 4 progressive hints that do NOT give away the answer directly.
8. Do NOT use obscure Python trivia. Keep it educational.
9. The function should be self-contained (no imports needed).
10. IMPORTANT: The "expected" field in each test must be the exact string that Python's json.dumps() or str() would output for that value. For example: a list [1,2,3] becomes "[1, 2, 3]", an integer 6 becomes "6", True becomes "true".

HINT GUIDELINES:
- Hint 1 (concept): Guide them to think about the RIGHT concept area
- Hint 2 (location): Point them to the approximate location (which line/expression)
- Hint 3 (direction): Describe what's wrong in general terms
- Hint 4 (almost-answer): Very strong hint without literally saying "change X to Y"

Return ONLY valid JSON matching this exact schema (no markdown, no code blocks):
{
  "title": "string — catchy challenge title",
  "functionName": "string — the Python function name",
  "correctCode": "string — the complete correct Python function",
  "buggyCode": "string — the same function with exactly one bug injected",
  "description": "string — brief scenario description (1 sentence)",
  "customerName": "string — fictional customer first name",
  "complaint": "string — customer's complaint in first person describing the observable symptom",
  "tests": [
    {"input": "string — Python arguments to pass e.g. [1,2,3] or 5, 'hello'", "expected": "string — exact expected output", "description": "string — what this test checks"}
  ],
  "hints": [
    {"level": 1, "type": "concept", "text": "string"},
    {"level": 2, "type": "location", "text": "string"},
    {"level": 3, "type": "direction", "text": "string"},
    {"level": 4, "type": "almost-answer", "text": "string"}
  ]
}
`.trim();
}

function buildChallenge(parsed: any, context: GenerationContext): Challenge {
  const timeLimits: Record<Difficulty, number> = { 1: 90, 2: 120, 3: 150, 4: 180, 5: 240 };
  const maxXPs: Record<Difficulty, number> = { 1: 100, 2: 150, 3: 200, 4: 300, 5: 500 };

  const id = crypto.randomUUID();
  const maxXP = maxXPs[context.difficulty];

  const hints: HintLevel[] = (parsed.hints || []).map((h: any, i: number) => ({
    level: h.level || i + 1,
    type: h.type,
    text: h.text,
    // Hints 1-3 cost 20% each, hint 4 costs 30%
    xpCost: i < 3 ? Math.round(maxXP * 0.2) : Math.round(maxXP * 0.3),
  }));

  return {
    id,
    title: parsed.title || 'Untitled Bug',
    description: parsed.description || '',
    customerName: parsed.customerName || 'Anonymous',
    complaint: parsed.complaint || 'Something seems off...',
    buggyCode: parsed.buggyCode || '',
    correctCode: parsed.correctCode || '',
    language: 'python',
    concept: context.concept,
    bugType: context.bugType,
    difficulty: context.difficulty,
    timeLimit: timeLimits[context.difficulty],
    maxXP,
    functionName: parsed.functionName || 'solution',
    tests: parsed.tests || [],
    hints,
  };
}

/** Pick a random bug type appropriate for the difficulty */
export function getRandomBugType(difficulty: Difficulty): BugType {
  const beginnerBugs: BugType[] = ['off-by-one', 'wrong-operator', 'wrong-variable', 'wrong-initialization'];
  const intermediateBugs: BugType[] = ['logic-inversion', 'missing-return', 'wrong-condition', 'boundary-error'];
  const advancedBugs: BugType[] = ['wrong-index', 'type-error', 'logic-inversion', 'boundary-error'];
  const pool = difficulty <= 2 ? beginnerBugs : difficulty <= 3 ? intermediateBugs : advancedBugs;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Pick a random concept appropriate for the difficulty */
export function getRandomConcept(difficulty: Difficulty): Concept {
  const beginner: BeginnerConcept[] = ['variables', 'if-statements', 'loops', 'lists', 'functions', 'strings'];
  const intermediate: IntermediateConcept[] = ['recursion', 'dictionaries', 'exceptions', 'classes', 'list-comprehensions', 'sorting'];
  const advanced: AdvancedConcept[] = ['generators', 'decorators', 'regex', 'data-structures', 'algorithms', 'math'];
  const pool = difficulty <= 2 ? beginner : difficulty <= 3 ? intermediate : advanced;
  return pool[Math.floor(Math.random() * pool.length)];
}
