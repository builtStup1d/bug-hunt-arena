// ============================================================
// Bug Hunt Arena — Core Type Definitions
// ============================================================

/** Difficulty levels for challenges */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Programming concepts — grouped by level */
export type BeginnerConcept =
  | 'variables'
  | 'if-statements'
  | 'loops'
  | 'lists'
  | 'functions'
  | 'strings';

export type IntermediateConcept =
  | 'recursion'
  | 'dictionaries'
  | 'exceptions'
  | 'classes'
  | 'list-comprehensions'
  | 'sorting';

export type AdvancedConcept =
  | 'generators'
  | 'decorators'
  | 'regex'
  | 'data-structures'
  | 'algorithms'
  | 'math';

export type Concept = BeginnerConcept | IntermediateConcept | AdvancedConcept;

/** Types of bugs that can be injected */
export type BugType =
  | 'off-by-one'
  | 'wrong-operator'
  | 'logic-inversion'
  | 'wrong-variable'
  | 'missing-return'
  | 'wrong-initialization'
  | 'wrong-index'
  | 'boundary-error'
  | 'type-error'
  | 'wrong-condition';

/** A test case for validating code */
export interface TestCase {
  input: string;
  expected: string;
  description: string;
}

/** Progressive hint */
export interface HintLevel {
  level: number;
  type: 'concept' | 'location' | 'direction' | 'almost-answer';
  text: string;
  xpCost: number;
}

/** A generated challenge (full — stored on backend) */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  customerName: string;
  complaint: string;
  buggyCode: string;
  correctCode: string;
  language: 'python';
  concept: Concept;
  bugType: BugType;
  difficulty: Difficulty;
  timeLimit: number;
  tests: TestCase[];
  hints: HintLevel[];
  maxXP: number;
  functionName: string;
}

/** What the client receives (no secrets) */
export interface ClientChallenge {
  id: string;
  title: string;
  description: string;
  customerName: string;
  complaint: string;
  buggyCode: string;
  language: 'python';
  concept: Concept;
  difficulty: Difficulty;
  timeLimit: number;
  maxXP: number;
  hintCount: number;
  functionName: string;
  tests: TestCase[];
  hints: HintLevel[];
}

/** Request to run user's code */
export interface RunRequest {
  challengeId: string;
  code: string;
  hintsUsed?: number;
  timeSpent?: number;
}

/** Individual test result */
export interface TestResult {
  passed: boolean;
  description: string;
  expected: string;
  actual: string;
  error?: string;
}

/** Result from running code */
export interface RunResult {
  success: boolean;
  testsPassed: number;
  testsTotal: number;
  testResults: TestResult[];
  error?: string;
  xpEarned: number;
  hintsUsed: number;
  message: string;
}

/** Hint request */
export interface HintRequest {
  challengeId: string;
  hintLevel: number;
}

/** Hint response */
export interface HintResponse {
  hint: HintLevel;
  remainingXP: number;
}

/** Player stats persisted in localStorage */
export interface PlayerStats {
  totalXP: number;
  level: number;
  bugsSquashed: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  perfectSolves: number;
}

/** Gemini challenge generation prompt context */
export interface GenerationContext {
  concept: Concept;
  difficulty: Difficulty;
  bugType: BugType;
  language: 'python';
}

/** Game state managed by Zustand */
export interface GameState {
  // Current game
  phase: 'menu' | 'loading' | 'playing' | 'success' | 'failure' | 'timeout';
  challenge: ClientChallenge | null;
  userCode: string;
  timeRemaining: number;
  timerActive: boolean;
  hintsRevealed: HintLevel[];
  currentHintLevel: number;
  runResult: RunResult | null;
  isRunning: boolean;

  // Player
  stats: PlayerStats;
  selectedDifficulty: Difficulty;
  selectedConcept: Concept | 'random';

  // Actions
  setPhase: (phase: GameState['phase']) => void;
  setChallenge: (challenge: ClientChallenge | null) => void;
  setUserCode: (code: string) => void;
  setTimeRemaining: (time: number) => void;
  setTimerActive: (active: boolean) => void;
  addHint: (hint: HintLevel) => void;
  setRunResult: (result: RunResult | null) => void;
  setIsRunning: (running: boolean) => void;
  setSelectedDifficulty: (d: Difficulty) => void;
  setSelectedConcept: (c: Concept | 'random') => void;
  updateStats: (result: RunResult) => void;
  resetGame: () => void;
  loadStats: () => void;
}
