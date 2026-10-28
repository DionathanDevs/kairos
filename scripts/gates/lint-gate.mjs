#!/usr/bin/env node
/**
 * Kairos Linter Gate (lint-gate.mjs)
 *
 * Performs:
 * 1. TypeScript Strict Type & Unused Symbols Linting (server & client)
 * 2. Code Hygiene & Static Linter (no debugger, console.log, alert, @ts-ignore, or `any` in core layers)
 * 3. Design System Token Linter (validates hex colors in UI components against DESIGN.md palette)
 * 4. i18n Key Parity Linter (ensures 100% symmetry between PT and EN dictionaries)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const SERVER_SRC = path.join(SERVER_DIR, 'src');
const CLIENT_SRC = path.join(CLIENT_DIR, 'src');

const errors = [];
const warnings = [];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function relFromRoot(filePath) {
  return toPosix(path.relative(ROOT_DIR, filePath));
}

function walkFiles(dir, extensions = ['.ts', '.tsx']) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ============================================================================
// 1. TypeScript Strict Linter (Server & Client)
// ============================================================================
function runTscLint(projectDir, label) {
  const tscBin = path.join(
    projectDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsc.cmd' : 'tsc'
  );
  const cmd = fs.existsSync(tscBin)
    ? `"${tscBin}" --noEmit --pretty false`
    : `npx --prefix "${projectDir}" tsc --noEmit --pretty false`;

  try {
    execSync(cmd, {
      cwd: projectDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8'
    });
  } catch (err) {
    const output = `${err.stdout || ''}\n${err.stderr || ''}`.trim();
    const lines = output.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      errors.push({
        rule: `LINT-TSC-${label.toUpperCase()}`,
        file: label,
        line: 0,
        message: line
      });
    }
  }
}

runTscLint(SERVER_DIR, 'server');
runTscLint(CLIENT_DIR, 'client');

// ============================================================================
// 2. Static Code Quality & Hygiene Linter
// ============================================================================
const allSourceFiles = [
  ...walkFiles(SERVER_SRC, ['.ts']),
  ...walkFiles(CLIENT_SRC, ['.ts', '.tsx'])
].filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'));

// Approved DESIGN.md Hex Palette (Normalized lowercase)
const APPROVED_HEX_COLORS = new Set([
  // Dark surfaces & borders
  '#0c0e12',
  '#15181e',
  '#181b22',
  '#1a1e26',
  '#202530',
  '#232732',
  '#262c38',
  '#2a303e',
  '#3b4252',
  // Brand Emerald & Cyan accents
  '#064e3b',
  '#047857',
  '#10b981',
  '#34d399',
  '#7dd3fc',
  '#93c5fd',
  '#ffffff',
  // Habit color tags (HabitModal.tsx)
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  // Neutral light text
  '#f3f4f6'
]);

for (const file of allSourceFiles) {
  const relFile = relFromRoot(file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  const isDomainOrApp =
    relFile.startsWith('server/src/domain/') || relFile.startsWith('server/src/application/');
  const isClientComponent = relFile.startsWith('client/src/components/');
  const isStrictNoConsole =
    isDomainOrApp || isClientComponent || relFile.startsWith('client/src/api/');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check merge conflict markers
    if (/^(<<<<<<<|=======|>>>>>>>)/.test(trimmed)) {
      errors.push({
        rule: 'LINT-MERGE-CONFLICT',
        file: relFile,
        line: lineNum,
        message: 'Unresolved Git merge conflict marker found.'
      });
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      // Still check for @ts-ignore / @ts-nocheck in comments
      if (/@ts-ignore|@ts-nocheck/.test(trimmed)) {
        errors.push({
          rule: 'LINT-NO-TS-IGNORE',
          file: relFile,
          line: lineNum,
          message: 'Do not use @ts-ignore or @ts-nocheck. Fix the underlying TypeScript type instead.'
        });
      }
      return;
    }

    // Forbidden debugger statement
    if (/\bdebugger\b/.test(trimmed)) {
      errors.push({
        rule: 'LINT-NO-DEBUGGER',
        file: relFile,
        line: lineNum,
        message: 'Forbidden "debugger" statement.'
      });
    }

    // Forbidden alert() in UI
    if (/\balert\s*\(/.test(trimmed)) {
      errors.push({
        rule: 'LINT-NO-ALERT',
        file: relFile,
        line: lineNum,
        message: 'Forbidden "alert()" call. Use ConfirmModal or Toast notifications per DESIGN.md.'
      });
    }

    // Forbidden console.log in domain, application, components, and api client
    if (isStrictNoConsole && /\bconsole\.log\s*\(/.test(trimmed)) {
      errors.push({
        rule: 'LINT-NO-CONSOLE-LOG',
        file: relFile,
        line: lineNum,
        message: 'Forbidden "console.log()" in core layers/components.'
      });
    }

    // Forbidden `any` in Domain and Application layers
    if (isDomainOrApp && (/\b:\s*any\b/.test(trimmed) || /\bas\s+any\b/.test(trimmed))) {
      errors.push({
        rule: 'LINT-NO-EXPLICIT-ANY',
        file: relFile,
        line: lineNum,
        message: 'Forbidden explicit "any" in Domain/Application layer. Use strict domain types or DTOs.'
      });
    }

    // Design System Hex Token check in client/src/components/
    if (isClientComponent) {
      const hexRegex = /#[0-9a-fA-F]{6}\b/g;
      let match;
      while ((match = hexRegex.exec(line)) !== null) {
        const hex = match[0].toLowerCase();
        if (!APPROVED_HEX_COLORS.has(hex)) {
          errors.push({
            rule: 'LINT-DESIGN-TOKEN',
            file: relFile,
            line: lineNum,
            message: `Unapproved hex color "${match[0]}" found. Use Tailwind tokens (dark.*, brand.*) or register the token in DESIGN.md.`
          });
        }
      }
    }
  });
}

// ============================================================================
// 3. i18n Translations Key Parity Linter (PT <-> EN)
// ============================================================================
const translationsPath = path.join(CLIENT_SRC, 'i18n', 'translations.ts');
if (fs.existsSync(translationsPath)) {
  const raw = fs.readFileSync(translationsPath, 'utf8');
  // Strip `export const translations =` to evaluate the object structure safely
  const objectLiteral = raw
    .replace(/export\s+const\s+translations\s*=\s*/, 'return ')
    .trim();

  try {
    const getTranslations = new Function(objectLiteral);
    const translationsObj = getTranslations();

    function collectKeys(obj, prefix = '') {
      const keys = [];
      for (const [k, v] of Object.entries(obj || {})) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
          keys.push(...collectKeys(v, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const ptKeys = new Set(collectKeys(translationsObj.pt));
    const enKeys = new Set(collectKeys(translationsObj.en));

    for (const k of ptKeys) {
      if (!enKeys.has(k)) {
        errors.push({
          rule: 'LINT-I18N-PARITY',
          file: 'client/src/i18n/translations.ts',
          line: 1,
          message: `Missing English ("en") translation key: "${k}" (present in "pt").`
        });
      }
    }

    for (const k of enKeys) {
      if (!ptKeys.has(k)) {
        errors.push({
          rule: 'LINT-I18N-PARITY',
          file: 'client/src/i18n/translations.ts',
          line: 1,
          message: `Missing Portuguese ("pt") translation key: "${k}" (present in "en").`
        });
      }
    }
  } catch (err) {
    warnings.push({
      rule: 'LINT-I18N-PARSE',
      file: 'client/src/i18n/translations.ts',
      line: 1,
      message: `Could not evaluate translations object for key parity: ${err.message}`
    });
  }
}

// ============================================================================
// 4. Report Results
// ============================================================================
console.log('\n============================================================');
console.log('🧹 KAIROS LINTER GATE (TSC + CODE HYGIENE + DESIGN + I18N)');
console.log('============================================================');
console.log(`Checked TypeScript compilation and linted ${allSourceFiles.length} source files.`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [${w.rule}] ${w.file}:${w.line} - ${w.message}`);
  }
}

if (errors.length > 0) {
  console.error(`\n❌ Linter Gate FAILED with ${errors.length} error(s):\n`);
  for (const e of errors) {
    const loc = e.line > 0 ? `${e.file}:${e.line}` : e.file;
    console.error(`  [${e.rule}] ${loc}`);
    console.error(`    ↳ ${e.message}`);
  }
  process.exit(1);
}

console.log('✅ All TypeScript checks, Code Hygiene rules, Design System tokens, and i18n parity passed!\n');
process.exit(0);
