#!/usr/bin/env node
/**
 * PostToolUse hook — fires after Claude runs `git commit` in ksp-frontend.
 *
 * WHAT THIS DOES (and the important distinction)
 * ----------------------------------------------
 * Two different things happen here, by two different mechanisms:
 *
 *   1. TESTS ARE ACTUALLY RUN. This is a real Node process, so it can execute
 *      `npm test` directly and report the result.
 *
 *   2. SKILLS ARE REQUESTED, NOT RUN. `/simplify` and `/code-review` are Claude Code
 *      skills that exist only inside a Claude session — no shell script can invoke them.
 *      What this hook can do is return `additionalContext`, which Claude reads and acts
 *      on by invoking the Skill tool itself.
 *
 * Frontend-specific note: Vitest defaults to WATCH mode when run bare, which would hang
 * this hook until the timeout. We pass `--run` to force a single pass. If the test script
 * already includes `--run` the flag is harmless and idempotent.
 *
 * Contract: always exit 0. A failing test suite is REPORTED, never used to block — the
 * commit has already happened by the time this runs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_NAME = 'ksp-frontend';

function report(message) {
  if (message) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: message,
        },
      }),
    );
  }
  process.exit(0);
}

let payload = {};
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  report(null);
}

// ---- 1. Is this actually a git commit? ------------------------------------
const command = payload?.tool_input?.command ?? '';
const isCommit = /\bgit\b[^\n&|;]*\bcommit\b/.test(command) && !/--dry-run/.test(command);
if (!isCommit) report(null);

const responseText = JSON.stringify(payload?.tool_response ?? '');
if (/nothing to commit|no changes added|Aborting commit/i.test(responseText)) report(null);

// ---- 2. What was actually committed? --------------------------------------
function git(args) {
  const r = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

const sha = git(['log', '-1', '--format=%h']);
const subject = git(['log', '-1', '--format=%s']);
if (!sha) report(null);

const changedFiles = (git(['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD']) || '')
  .split('\n')
  .filter(Boolean);

// Source changes only. Generated API client output is excluded — it is build output,
// so there is nothing there for a human review pass to act on.
const sourceFiles = changedFiles.filter(
  (f) => /^src\//.test(f) && !/^src\/api\/generated\//.test(f),
);
const touchedSource = sourceFiles.length > 0;

// ---- 3. Run the tests (really run them) -----------------------------------
let testSummary = null;

if (touchedSource && existsSync(join(REPO_ROOT, 'package.json'))) {
  let hasTestScript = false;
  try {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'));
    hasTestScript = Boolean(pkg?.scripts?.test);
  } catch {
    hasTestScript = false;
  }

  if (hasTestScript) {
    // `--` forwards `--run` to Vitest, defeating its default watch mode.
    const run = spawnSync('npm', ['test', '--silent', '--', '--run'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      timeout: 300_000,
    });

    if (run.error?.code === 'ETIMEDOUT') {
      testSummary =
        'TESTS TIMED OUT after 5 minutes — the runner is probably stuck in watch mode.';
    } else if (run.status === 0) {
      testSummary = 'Tests PASSED.';
    } else {
      const output = `${run.stdout || ''}${run.stderr || ''}`.trim().split('\n');
      testSummary = `Tests FAILED (exit ${run.status}):\n` + output.slice(-25).join('\n');
    }
  }
}

// ---- 4. Ask Claude to run the review skills --------------------------------
if (!touchedSource) report(null);

const lines = [
  `Commit ${sha} in ${REPO_NAME} touched ${sourceFiles.length} source file(s): ${subject}`,
];

if (testSummary) lines.push('', testSummary);

lines.push(
  '',
  'POST-COMMIT REVIEW — run all three now, in this order:',
  '  1. Skill: test-coverage-check       (are tests MISSING for what changed?)',
  '  2. Skill: simplify                  (reuse, simplification, efficiency cleanups)',
  '  3. Skill: code-review:code-review   (correctness bugs in the diff)',
  '',
  'Coverage goes first because this project\'s rule is that nothing is done without',
  'tests — a missing test is a bigger problem than an unsimplified line, and writing',
  'the test first means the other two passes review code that is actually covered.',
  '',
  'Then fix anything they surface and amend or follow up with a commit.',
  '',
  'SKIP ALL THREE if this commit was itself the result of applying /simplify output,',
  'review fixes, or added tests — otherwise this loops indefinitely. Also fix any',
  'failing tests above BEFORE running them, so they review working code.',
);

report(lines.join('\n'));
