import { lstat, realpath, stat, symlink, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export async function ensurePlanningAlias(repoRoot) {
  const canonical = join(repoRoot, '.openspec');
  if (!(await stat(canonical)).isDirectory()) throw new Error('Expected .openspec directory.');
  const expected = await realpath(canonical);
  const alias = join(repoRoot, 'openspec');
  try {
    await lstat(alias);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try {
      await symlink(process.platform === 'win32' ? canonical : '.openspec', alias,
        process.platform === 'win32' ? 'junction' : 'dir');
    } catch (creationError) {
      if (creationError.code !== 'EEXIST') throw creationError;
    }
  }
  const entry = await lstat(alias);
  if (!entry.isSymbolicLink()) throw new Error('openspec is a real directory/file; refusing to overwrite it.');
  let actual;
  try { actual = await realpath(alias); }
  catch { throw new Error('openspec is a broken alias; repair it to point to .openspec.'); }
  if (actual !== expected) throw new Error('openspec points elsewhere; refusing to change it.');
  return alias;
}

export async function runOpenSpec({ repoRoot = dirname(appRoot), args = process.argv.slice(2),
  cliPath = join(appRoot, 'node_modules/@fission-ai/openspec/bin/openspec.js') } = {}) {
  await ensurePlanningAlias(repoRoot);
  const local = join(repoRoot, 'CITRUS_WORLD/.local/openspec');
  await mkdir(local, { recursive: true });
  return new Promise((accept, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: repoRoot, stdio: 'inherit',
      env: { ...process.env, OPENSPEC_TELEMETRY: '0',
        APPDATA: join(local, 'appdata'), XDG_CONFIG_HOME: join(local, 'config'),
        XDG_DATA_HOME: join(local, 'data'), XDG_CACHE_HOME: join(local, 'cache') },
    });
    const forward = signal => child.kill(signal);
    const interrupt = () => forward('SIGINT');
    const terminate = () => forward('SIGTERM');
    process.on('SIGINT', interrupt); process.on('SIGTERM', terminate);
    const cleanup = () => { process.off('SIGINT', interrupt); process.off('SIGTERM', terminate); };
    child.once('error', error => { cleanup(); reject(error); });
    child.once('exit', code => { cleanup(); accept(code ?? 1); });
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runOpenSpec().then(code => { process.exitCode = code; })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
