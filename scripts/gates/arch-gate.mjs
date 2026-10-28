#!/usr/bin/env node
/**
 * Kairos Architecture Gate (arch-gate.mjs)
 *
 * Enforces Clean Architecture boundaries, Frontend API isolation,
 * Circular Dependency detection, and NodeNext ESM import conventions.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SERVER_SRC = path.join(ROOT_DIR, 'server', 'src');
const CLIENT_SRC = path.join(ROOT_DIR, 'client', 'src');

const violations = [];
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

/**
 * Extracts all static and dynamic import specifiers with line numbers.
 */
function extractImports(content) {
  const imports = [];
  const lines = content.split(/\r?\n/);

  const importRegex = /(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    let match;
    importRegex.lastIndex = 0;
    while ((match = importRegex.exec(line)) !== null) {
      const specifier = match[1] || match[2];
      if (specifier) {
        imports.push({ specifier, line: idx + 1, rawLine: trimmed });
      }
    }
  });

  return imports;
}

/**
 * Determines the Clean Architecture layer of a file in server/src.
 */
function getServerLayer(filePath) {
  const rel = toPosix(path.relative(SERVER_SRC, filePath));
  if (rel.startsWith('domain/')) return 'domain';
  if (rel.startsWith('application/')) return 'application';
  if (rel.startsWith('infrastructure/')) return 'infrastructure';
  if (rel.startsWith('presentation/')) return 'presentation';
  return 'root'; // app.ts, index.ts, types.ts
}

/**
 * Resolves a relative import specifier to an actual file path on disk.
 */
function resolveImportPath(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const baseDir = path.dirname(sourceFile);
  // Strip .js extension used by NodeNext ESM to locate .ts/.tsx source file
  const stripped = specifier.replace(/\.js$/, '');
  const candidates = [
    path.resolve(baseDir, specifier),
    path.resolve(baseDir, stripped + '.ts'),
    path.resolve(baseDir, stripped + '.tsx'),
    path.resolve(baseDir, stripped, 'index.ts'),
    path.resolve(baseDir, stripped, 'index.tsx')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return path.resolve(baseDir, stripped);
}

// ============================================================================
// 1. Validate Server Clean Architecture & ESM Rules
// ============================================================================
const serverFiles = walkFiles(SERVER_SRC, ['.ts']);
const dependencyGraph = new Map();

const FORBIDDEN_DOMAIN_PACKAGES = ['express', 'cors', 'node:sqlite', 'node:fs', 'node:http', 'node:https', 'supertest'];
const FORBIDDEN_APPLICATION_PACKAGES = ['express', 'cors', 'node:sqlite', 'node:http', 'supertest'];

for (const file of serverFiles) {
  const relFile = relFromRoot(file);
  const sourceLayer = getServerLayer(file);
  const content = fs.readFileSync(file, 'utf8');
  const imports = extractImports(content);
  const resolvedDeps = [];

  for (const imp of imports) {
    const { specifier, line } = imp;

    // Rule: NodeNext ESM requires explicit .js extension on relative imports in server/src
    if (specifier.startsWith('.')) {
      if (!specifier.endsWith('.js') && !specifier.endsWith('.json')) {
        violations.push({
          rule: 'ARCH-ESM-001',
          file: relFile,
          line,
          message: `Relative import "${specifier}" in server/src must end with ".js" (NodeNext ESM standard).`
        });
      }

      const targetPath = resolveImportPath(file, specifier);
      if (targetPath) {
        resolvedDeps.push(targetPath);

        // Cross-project boundary check
        if (!toPosix(targetPath).startsWith(toPosix(SERVER_SRC))) {
          violations.push({
            rule: 'ARCH-BOUNDARY-001',
            file: relFile,
            line,
            message: `Server file cannot import from outside server/src ("${specifier}").`
          });
          continue;
        }

        const targetLayer = getServerLayer(targetPath);

        // Clean Architecture Layer Rules
        if (sourceLayer === 'domain' && targetLayer !== 'domain') {
          violations.push({
            rule: 'ARCH-CLEAN-DOMAIN',
            file: relFile,
            line,
            message: `Domain layer violation: "domain" cannot depend on "${targetLayer}" (${specifier}).`
          });
        }

        if (sourceLayer === 'application' && !['domain', 'application'].includes(targetLayer)) {
          violations.push({
            rule: 'ARCH-CLEAN-APP',
            file: relFile,
            line,
            message: `Application layer violation: "application" cannot depend on "${targetLayer}" (${specifier}). Only "domain" and "application" are allowed.`
          });
        }

        if (sourceLayer === 'infrastructure' && !['domain', 'application', 'infrastructure'].includes(targetLayer)) {
          violations.push({
            rule: 'ARCH-CLEAN-INFRA',
            file: relFile,
            line,
            message: `Infrastructure layer violation: "infrastructure" cannot depend on "${targetLayer}" (${specifier}).`
          });
        }

        const isTypeOnlyImport = /^import\s+type\b/.test(imp.rawLine);
        if (sourceLayer === 'presentation' && targetLayer === 'infrastructure' && !isTypeOnlyImport) {
          violations.push({
            rule: 'ARCH-CLEAN-PRES',
            file: relFile,
            line,
            message: `Presentation layer violation: "presentation" must not import concrete runtime "infrastructure" modules (${specifier}). Inject dependencies via app.ts or use "import type".`
          });
        }
      }
    } else {
      // Package / Built-in import checks
      if (sourceLayer === 'domain' && FORBIDDEN_DOMAIN_PACKAGES.includes(specifier)) {
        violations.push({
          rule: 'ARCH-DOMAIN-PURITY',
          file: relFile,
          line,
          message: `Domain purity violation: "domain" must be framework and I/O agnostic (forbidden import: "${specifier}").`
        });
      }

      if (sourceLayer === 'application' && FORBIDDEN_APPLICATION_PACKAGES.includes(specifier)) {
        violations.push({
          rule: 'ARCH-APP-PURITY',
          file: relFile,
          line,
          message: `Application purity violation: "application" must not import infrastructure/HTTP packages (forbidden import: "${specifier}").`
        });
      }

      if (sourceLayer === 'presentation' && specifier === 'node:sqlite') {
        violations.push({
          rule: 'ARCH-PRES-SQLITE',
          file: relFile,
          line,
          message: `Presentation layer cannot access "node:sqlite" directly.`
        });
      }
    }
  }

  dependencyGraph.set(file, resolvedDeps);
}

// ============================================================================
// 2. Validate Client Frontend Architecture Rules
// ============================================================================
const clientFiles = walkFiles(CLIENT_SRC, ['.ts', '.tsx']).filter(
  (f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx')
);

for (const file of clientFiles) {
  const relFile = relFromRoot(file);
  const relClient = toPosix(path.relative(CLIENT_SRC, file));
  const content = fs.readFileSync(file, 'utf8');
  const imports = extractImports(content);
  const resolvedDeps = [];

  for (const imp of imports) {
    const { specifier, line } = imp;
    if (specifier.startsWith('.')) {
      const targetPath = resolveImportPath(file, specifier);
      if (targetPath) {
        resolvedDeps.push(targetPath);

        if (!toPosix(targetPath).startsWith(toPosix(CLIENT_SRC))) {
          violations.push({
            rule: 'ARCH-CLIENT-BOUNDARY',
            file: relFile,
            line,
            message: `Client file cannot import from outside client/src ("${specifier}").`
          });
        }
      }
    }
  }

  // Rule: UI components must not bypass client/src/api/client.ts with direct fetch() calls
  if (relClient.startsWith('components/')) {
    const lines = content.split(/\r?\n/);
    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (/\bfetch\s*\(/.test(trimmed)) {
        violations.push({
          rule: 'ARCH-CLIENT-API',
          file: relFile,
          line: idx + 1,
          message: `UI components must not call fetch() directly. Use the centralized API client in "client/src/api/client.ts".`
        });
      }
    });
  }

  dependencyGraph.set(file, resolvedDeps);
}

// ============================================================================
// 3. Circular Dependency Detection (DFS Cycle Detection)
// ============================================================================
const visited = new Set();
const recursionStack = new Set();
const recordedCycles = new Set();

function detectCycles(currentFile, pathChain = []) {
  visited.add(currentFile);
  recursionStack.add(currentFile);
  const nextChain = [...pathChain, currentFile];

  const neighbors = dependencyGraph.get(currentFile) || [];
  for (const neighbor of neighbors) {
    if (!dependencyGraph.has(neighbor)) continue;

    if (!visited.has(neighbor)) {
      detectCycles(neighbor, nextChain);
    } else if (recursionStack.has(neighbor)) {
      const cycleStartIndex = nextChain.indexOf(neighbor);
      const cycleFiles = nextChain
        .slice(cycleStartIndex)
        .concat(neighbor)
        .map((f) => relFromRoot(f));
      const cycleKey = cycleFiles.slice(0, -1).sort().join('|');
      if (!recordedCycles.has(cycleKey)) {
        recordedCycles.add(cycleKey);
        violations.push({
          rule: 'ARCH-CYCLE-001',
          file: cycleFiles[0],
          line: 1,
          message: `Circular dependency detected: ${cycleFiles.join(' -> ')}`
        });
      }
    }
  }

  recursionStack.delete(currentFile);
}

for (const file of dependencyGraph.keys()) {
  if (!visited.has(file)) {
    detectCycles(file, []);
  }
}

// ============================================================================
// 4. Report Results
// ============================================================================
console.log('\n============================================================');
console.log('🏛️  KAIROS ARCHITECTURE GATE');
console.log('============================================================');
console.log(`Scanned ${serverFiles.length} server files and ${clientFiles.length} client files.`);

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  [${w.rule}] ${w.file}:${w.line} - ${w.message}`);
  }
}

if (violations.length > 0) {
  console.error(`\n❌ Architecture Gate FAILED with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ↳ ${v.message}`);
  }
  console.error('\n💡 Tip: Consult ARCHITECTURE.md and .agents/skills/architecture-gate/SKILL.md.');
  process.exit(1);
}

console.log('✅ All Clean Architecture boundaries, API isolation, and ESM rules passed!\n');
process.exit(0);
