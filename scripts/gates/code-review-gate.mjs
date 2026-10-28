#!/usr/bin/env node
/**
 * Kairos AI Code Review Gate (code-review-gate.mjs)
 *
 * Automated structural and semantic code review checks designed to run
 * during the AI agent's test loop:
 * 1. Domain Services & Entities Unit Test Parity
 * 2. SQL Migrations Sequential Ordering & Idempotence (IF NOT EXISTS)
 * 3. Controller Error Mapping Standard (ValidationError, NotFoundError, DomainError)
 * 4. File Size & Complexity Thresholds
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SERVER_DIR = path.join(ROOT_DIR, 'server');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');

const issues = [];
const advisories = [];

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
// 1. Domain Services Unit Test Parity Check
// ============================================================================
const domainServicesDir = path.join(SERVER_DIR, 'src', 'domain', 'services');
const domainTestsDir = path.join(SERVER_DIR, 'test', 'unit', 'domain');

if (fs.existsSync(domainServicesDir)) {
  const serviceFiles = fs
    .readdirSync(domainServicesDir)
    .filter((f) => f.endsWith('.ts'));

  for (const serviceFile of serviceFiles) {
    const baseName = serviceFile.replace(/\.ts$/, '');
    const expectedTest = path.join(domainTestsDir, `${baseName}.test.ts`);
    if (!fs.existsSync(expectedTest)) {
      issues.push({
        rule: 'REVIEW-DOMAIN-TEST-PARITY',
        file: `server/src/domain/services/${serviceFile}`,
        message: `Domain service "${baseName}" is missing its unit test at "server/test/unit/domain/${baseName}.test.ts".`
      });
    }
  }
}

// ============================================================================
// 2. SQL Migrations Sequential & Idempotency Check
// ============================================================================
const migrationsDir = path.join(SERVER_DIR, 'migrations');
if (fs.existsSync(migrationsDir)) {
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const seenPrefixes = new Set();
  sqlFiles.forEach((sqlFile, idx) => {
    const match = /^(\d{3})_[a-z0-9_]+\.sql$/.exec(sqlFile);
    if (!match) {
      issues.push({
        rule: 'REVIEW-MIGRATION-NAMING',
        file: `server/migrations/${sqlFile}`,
        message: `Migration file "${sqlFile}" must follow pattern "NNN_snake_case_description.sql" (e.g., 004_add_column.sql).`
      });
      return;
    }

    const prefixNum = parseInt(match[1], 10);
    const expectedNum = idx + 1;
    if (seenPrefixes.has(prefixNum)) {
      issues.push({
        rule: 'REVIEW-MIGRATION-DUPLICATE',
        file: `server/migrations/${sqlFile}`,
        message: `Duplicate migration sequence number "${match[1]}".`
      });
    }
    seenPrefixes.add(prefixNum);

    if (prefixNum !== expectedNum) {
      issues.push({
        rule: 'REVIEW-MIGRATION-SEQUENCE',
        file: `server/migrations/${sqlFile}`,
        message: `Migration sequence gap: expected ${String(expectedNum).padStart(3, '0')}, found ${match[1]}.`
      });
    }

    const sqlContent = fs.readFileSync(path.join(migrationsDir, sqlFile), 'utf8');
    if (/CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i.test(sqlContent)) {
      issues.push({
        rule: 'REVIEW-MIGRATION-IDEMPOTENCY',
        file: `server/migrations/${sqlFile}`,
        message: `CREATE TABLE in "${sqlFile}" must use "CREATE TABLE IF NOT EXISTS" for idempotency.`
      });
    }
  });
}

// ============================================================================
// 3. Controller Error Mapping Standard Check
// ============================================================================
const controllersDir = path.join(SERVER_DIR, 'src', 'presentation', 'controllers');
if (fs.existsSync(controllersDir)) {
  const controllerFiles = fs
    .readdirSync(controllersDir)
    .filter((f) => f.endsWith('.ts') && !f.includes('Webhook'));

  for (const ctrlFile of controllerFiles) {
    const fullPath = path.join(controllersDir, ctrlFile);
    const content = fs.readFileSync(fullPath, 'utf8');
    const requiredErrors = ['ValidationError', 'NotFoundError', 'DomainError'];

    for (const errClass of requiredErrors) {
      if (!content.includes(errClass)) {
        issues.push({
          rule: 'REVIEW-CONTROLLER-ERRORS',
          file: `server/src/presentation/controllers/${ctrlFile}`,
          message: `REST Controller "${ctrlFile}" must handle "${errClass}" to map domain errors to proper HTTP status codes (400/404/422).`
        });
      }
    }
  }
}

// ============================================================================
// 4. File Size & Modularity Review
// ============================================================================
const sourceFiles = [
  ...walkFiles(path.join(SERVER_DIR, 'src'), ['.ts']),
  ...walkFiles(path.join(CLIENT_DIR, 'src'), ['.ts', '.tsx'])
];

const WARN_LINES = 450;
const MAX_LINES = 800;

for (const file of sourceFiles) {
  const relFile = relFromRoot(file);
  const lineCount = fs.readFileSync(file, 'utf8').split(/\r?\n/).length;

  if (lineCount > MAX_LINES) {
    issues.push({
      rule: 'REVIEW-FILE-SIZE-MAX',
      file: relFile,
      message: `File has ${lineCount} lines (exceeds hard limit of ${MAX_LINES}). Split responsibilities into smaller modules.`
    });
  } else if (lineCount > WARN_LINES) {
    advisories.push({
      rule: 'REVIEW-FILE-SIZE-WARN',
      file: relFile,
      message: `File has ${lineCount} lines (approaching ${WARN_LINES}+ threshold). Consider extracting helper components or hooks.`
    });
  }
}

// ============================================================================
// 5. Report Results
// ============================================================================
console.log('\n============================================================');
console.log('🔍 KAIROS AI CODE REVIEW GATE');
console.log('============================================================');

if (advisories.length > 0) {
  console.log(`\n💡 Review Advisories (${advisories.length}):`);
  for (const a of advisories) {
    console.log(`  [${a.rule}] ${a.file} - ${a.message}`);
  }
}

if (issues.length > 0) {
  console.error(`\n❌ Code Review Gate FAILED with ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.error(`  [${issue.rule}] ${issue.file}`);
    console.error(`    ↳ ${issue.message}`);
  }
  console.error('\n💡 Tip: Consult .agents/skills/ai-code-review/SKILL.md for resolution guidance.');
  process.exit(1);
}

console.log('✅ Domain Test Parity, SQL Migrations, Controller Error Mapping, and Modularity checks passed!\n');
process.exit(0);
