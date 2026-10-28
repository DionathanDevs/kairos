#!/usr/bin/env node
/**
 * Kairos Master Quality Gate Runner (run-all-gates.mjs)
 *
 * Runs the complete verification pipeline:
 * 1. Architecture Gate (Clean Architecture, API boundaries, Circular Deps, ESM)
 * 2. Linter Gate (TypeScript Strict Check, Code Hygiene, Design Tokens, i18n Parity)
 * 3. AI Code Review Gate (Domain Test Parity, SQL Migrations, Controller Error Mapping)
 * 4. Backend Unit & Integration Tests (Jest)
 * 5. Frontend Component Tests (Vitest)
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const steps = [
  {
    name: '1. Architecture Gate',
    cmd: 'node',
    args: ['scripts/gates/arch-gate.mjs']
  },
  {
    name: '2. Linter Gate (TSC + Style + Design + i18n)',
    cmd: 'node',
    args: ['scripts/gates/lint-gate.mjs']
  },
  {
    name: '3. AI Code Review Gate',
    cmd: 'node',
    args: ['scripts/gates/code-review-gate.mjs']
  },
  {
    name: '4. Backend Tests (Jest Unit & Integration)',
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'test', '--prefix', 'server']
  },
  {
    name: '5. Frontend Tests (Vitest Components)',
    cmd: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'test', '--prefix', 'client']
  }
];

const results = [];
let hasFailure = false;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║          🚀 KAIROS AI QUALITY GATES & TEST SUITE           ║');
console.log('╚════════════════════════════════════════════════════════════╝');

for (const step of steps) {
  const start = Date.now();
  const proc = spawnSync(step.cmd, step.args, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  const durationMs = Date.now() - start;
  const passed = proc.status === 0;

  results.push({
    name: step.name,
    passed,
    durationSec: (durationMs / 1000).toFixed(2)
  });

  if (!passed) {
    hasFailure = true;
    break; // Fail fast so the AI can immediately inspect and fix the broken gate
  }
}

console.log('\n============================================================');
console.log('📊 QUALITY GATES EXECUTION SUMMARY');
console.log('============================================================');
for (const r of results) {
  const icon = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${r.name.padEnd(44)} | ${r.durationSec}s`);
}
console.log('============================================================\n');

if (hasFailure) {
  console.error('❌ Quality Gate Pipeline FAILED. Fix the reported issues above and re-run `npm run gate:all`.\n');
  process.exit(1);
}

console.log('🎉 All Quality Gates and Automated Tests PASSED!\n');
process.exit(0);
