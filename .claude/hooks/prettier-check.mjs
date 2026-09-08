#!/usr/bin/env node
/**
 * PostToolUse hook — Prettier check for ksp-frontend.
 *
 * Self-contained on purpose: a subdirectory's .claude/settings.json is NOT layered on the
 * workspace-root one, so this repo must carry everything it needs. It also means this hook
 * fires when Claude is launched from ksp-frontend/ — and it travels with the repo when
 * cloned on its own.
 *
 * Note for this repo specifically: once `prettier-plugin-tailwindcss` is installed, this
 * same check also enforces canonical Tailwind class ORDER, so class lists stay readable
 * without anyone arguing about it in review.
 *
 * Generated files under src/api/generated/ are skipped — they are build output.
 *
 * Contract: exit 0 and print JSON on stdout. Never blocks.
 */

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PRETTIER_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.css', '.scss', '.html', '.md', '.yml', '.yaml',
]);

/** Build output — never our problem to format. */
const SKIP = [`${sep}src${sep}api${sep}generated${sep}`, `${sep}node_modules${sep}`, `${sep}dist${sep}`];

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

const filePath = payload?.tool_input?.file_path;
if (!filePath) report(null);

const absolute = resolve(filePath);

if (!absolute.startsWith(REPO_ROOT + sep)) report(null);
if (SKIP.some((fragment) => absolute.includes(fragment))) report(null);

const ext = absolute.slice(absolute.lastIndexOf('.'));
if (!PRETTIER_EXTS.has(ext)) report(null);

const bin = join(
  REPO_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'prettier.cmd' : 'prettier',
);
if (!existsSync(bin)) report(null);

const result = spawnSync(bin, ['--check', absolute], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status === 0) report(null);

const detail = `${result.stdout || ''}${result.stderr || ''}`
  .trim()
  .split('\n')
  .slice(0, 5)
  .join('\n');

report(
  `Prettier check FAILED (ksp-frontend) for ${absolute.split(sep).pop()}.\n${detail}\n` +
    `Fix with: npx prettier --write "${absolute}"`,
);
