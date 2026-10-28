import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const GITLEAKS_VERSION = '8.24.0';

function logHeader(title) {
  console.log('\n============================================================');
  console.log(`▶ ${title}`);
  console.log('============================================================');
}

function runCmd(command, args, cwd = ROOT_DIR, options = {}) {
  const isWin = process.platform === 'win32';
  const useShell = options.shell ?? (isWin && (command === 'npm' || command === 'npx'));
  const result = spawnSync(command, args, {
    cwd,
    stdio: options.stdio || 'inherit',
    shell: useShell,
    encoding: 'utf-8'
  });
  return result;
}

async function resolveGitleaksBinary() {
  // 1. Check system PATH
  const checkSystem = spawnSync('gitleaks', ['version'], {
    stdio: 'pipe',
    shell: process.platform === 'win32',
    encoding: 'utf-8'
  });
  if (checkSystem.status === 0) {
    return 'gitleaks';
  }

  // 2. Check cached binary in OS temp directory
  const cacheDir = path.join(os.tmpdir(), `gitleaks-${GITLEAKS_VERSION}`);
  const binName = process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks';
  const cachedBinPath = path.join(cacheDir, binName);
  if (fs.existsSync(cachedBinPath)) {
    return cachedBinPath;
  }

  // 3. Download portable official Gitleaks release binary into OS temp directory
  const platformMap = {
    win32: 'windows',
    linux: 'linux',
    darwin: 'darwin'
  };
  const archMap = {
    x64: 'x64',
    arm64: 'arm64'
  };

  const osName = platformMap[process.platform];
  const archName = archMap[process.arch];
  if (!osName || !archName) {
    return null;
  }

  const ext = process.platform === 'win32' ? 'zip' : 'tar.gz';
  const archiveName = `gitleaks_${GITLEAKS_VERSION}_${osName}_${archName}.${ext}`;
  const downloadUrl = `https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/${archiveName}`;

  console.log(`[Gitleaks] Binário não encontrado no PATH. Baixando Gitleaks v${GITLEAKS_VERSION} oficial...`);
  fs.mkdirSync(cacheDir, { recursive: true });
  const archivePath = path.join(cacheDir, archiveName);

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ao baixar ${downloadUrl}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(archivePath, Buffer.from(arrayBuffer));

    if (process.platform === 'win32') {
      const unzip = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Path '${archivePath}' -DestinationPath '${cacheDir}' -Force`
        ],
        { stdio: 'pipe', encoding: 'utf-8' }
      );
      if (unzip.status !== 0) {
        throw new Error(unzip.stderr || 'Falha ao extrair zip do Gitleaks');
      }
    } else {
      const untar = spawnSync('tar', ['-xzf', archivePath, '-C', cacheDir], {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      if (untar.status !== 0) {
        throw new Error(untar.stderr || 'Falha ao extrair tar.gz do Gitleaks');
      }
      fs.chmodSync(cachedBinPath, 0o755);
    }

    if (fs.existsSync(cachedBinPath)) {
      return cachedBinPath;
    }
  } catch (err) {
    console.warn(`[Gitleaks] Aviso ao baixar binário portátil: ${err.message}`);
  }

  return null;
}

async function runGitleaksStep() {
  logHeader('1/3 - Gitleaks Secret Detection (Git History & Working Tree)');

  const gitleaksBin = await resolveGitleaksBinary();
  if (!gitleaksBin) {
    console.error('❌ Não foi possível localizar ou baixar o binário do Gitleaks.');
    process.exit(1);
  }

  console.log('🔍 Escaneando histórico de commits Git (gitleaks git)...');
  const gitScan = runCmd(
    gitleaksBin,
    ['git', '.', '--config', '.gitleaks.toml', '--no-banner', '--redact', '-v'],
    ROOT_DIR,
    { shell: false }
  );

  if (gitScan.status !== 0) {
    console.error('❌ Gitleaks detectou vazamento de segredos no histórico Git!');
    process.exit(gitScan.status || 1);
  }

  console.log('\n🔍 Escaneando arquivos atuais do projeto (gitleaks dir)...');
  const dirScan = runCmd(
    gitleaksBin,
    ['dir', '.', '--config', '.gitleaks.toml', '--no-banner', '--redact', '-v'],
    ROOT_DIR,
    { shell: false }
  );

  if (dirScan.status !== 0) {
    console.error('❌ Gitleaks detectou segredos expostos nos arquivos do projeto!');
    process.exit(dirScan.status || 1);
  }

  console.log('✅ Gitleaks concluído: nenhum segredo exposto!');
}

function runNpmAuditStep() {
  logHeader('2/3 - NPM Security Audit (server & client)');

  const targets = [
    { name: 'server (production)', dir: path.join(ROOT_DIR, 'server'), args: ['audit', '--omit=dev', '--audit-level=low'] },
    { name: 'server (all deps)', dir: path.join(ROOT_DIR, 'server'), args: ['audit', '--audit-level=moderate'] },
    { name: 'client (production)', dir: path.join(ROOT_DIR, 'client'), args: ['audit', '--omit=dev', '--audit-level=low'] }
  ];

  for (const target of targets) {
    if (!fs.existsSync(path.join(target.dir, 'package-lock.json'))) continue;
    console.log(`\n📦 Executando npm ${target.args.join(' ')} em [${target.name}]...`);
    const auditRes = runCmd('npm', target.args, target.dir);
    if (auditRes.status !== 0) {
      console.error(`❌ npm audit falhou em [${target.name}]!`);
      process.exit(auditRes.status || 1);
    }
  }

  console.log('✅ npm audit concluído sem vulnerabilidades!');
}

function runTestsStep() {
  logHeader('3/3 - Testes Unitários e de Integração');

  console.log('🧪 Executando testes unitários (npm run test:unit)...');
  const unitRes = runCmd('npm', ['run', 'test:unit'], ROOT_DIR);
  if (unitRes.status !== 0) {
    console.error('❌ Falha nos testes unitários!');
    process.exit(unitRes.status || 1);
  }

  console.log('\n🧪 Executando testes de integração (npm run test:integration)...');
  const intRes = runCmd('npm', ['run', 'test:integration'], ROOT_DIR);
  if (intRes.status !== 0) {
    console.error('❌ Falha nos testes de integração!');
    process.exit(intRes.status || 1);
  }

  console.log('✅ Todos os testes unitários e de integração passaram!');
}

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1];

  if (!onlyArg || onlyArg === 'gitleaks') {
    await runGitleaksStep();
  }
  if (!onlyArg || onlyArg === 'audit') {
    runNpmAuditStep();
  }
  if (!onlyArg || onlyArg === 'test') {
    runTestsStep();
  }

  console.log('\n============================================================');
  console.log('🎉 VERIFICAÇÃO PÓS-DESENVOLVIMENTO CONCLUÍDA COM SUCESSO!');
  console.log('============================================================\n');
}

main().catch((err) => {
  console.error('❌ Erro fatal na verificação:', err);
  process.exit(1);
});
