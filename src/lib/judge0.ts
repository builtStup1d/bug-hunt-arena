import { TestCase, TestResult } from '@/lib/types';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

const execFileAsync = promisify(execFile);

export function buildTestScript(userCode: string, functionName: string, testInput: string): string {
  // Not used in the local executor, but kept for type compatibility
  return '';
}

/**
 * Execute user code against test cases locally using Python child_process.
 * Bypasses Docker/Judge0 entirely for local MVP/hackathon environments.
 */
export async function executeCode(
  code: string,
  testCases: TestCase[],
  functionName: string
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const tc of testCases) {
    const scriptPath = join(tmpdir(), `test_${randomUUID()}.py`);
    
    // Create a robust test script that handles json serialization
    const scriptContent = `
import json
import sys

${code}

try:
    result = ${functionName}(${tc.input})
    if isinstance(result, bool):
        print(str(result).lower())
    elif isinstance(result, str):
        print(result)
    elif result is None:
        print("None")
    else:
        print(json.dumps(result, separators=(', ', ': ')))
except Exception as e:
    import traceback
    print(f"RUNTIME_ERROR: {type(e).__name__}: {e}", file=sys.stderr)
    sys.exit(1)
`;

    try {
      writeFileSync(scriptPath, scriptContent);
      
      let actual = '';
      let errorStr: string | undefined = undefined;
      let passed = false;

      try {
        const { stdout: out, stderr: err } = await execFileAsync('python3', [scriptPath], { timeout: 3000 });
        actual = out.trim();
        const expected = tc.expected.trim();
        
        // Flexible string comparison
        passed = actual === expected || actual === `"${expected}"` || `"${actual}"` === expected;
        
        if (err && !passed) {
           errorStr = err.trim();
           actual = errorStr;
        }
      } catch (err: any) {
        const stderr = (err.stderr || '').trim();
        errorStr = err.killed ? "Time Limit Exceeded (Infinite Loop?)" : (stderr || err.message);
        actual = errorStr ?? 'Unknown error';
      }

      results.push({
        passed,
        description: tc.description,
        expected: tc.expected,
        actual: actual || 'No output',
        error: errorStr,
      });

    } finally {
      try {
        unlinkSync(scriptPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  return results;
}
