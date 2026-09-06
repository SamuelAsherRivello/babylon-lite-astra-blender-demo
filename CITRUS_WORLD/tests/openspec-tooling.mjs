import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, realpath, lstat, symlink, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensurePlanningAlias, runOpenSpec } from '../scripts/openspec.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'citrus-openspec-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.openspec'));
  await writeFile(join(root, '.openspec/sentinel'), 'preserve');
  return root;
}
const link = (target, alias) => symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir');

test('creates and reuses one alias, including simultaneous first invocations', async t => {
  const root = await fixture(t);
  const aliases = await Promise.all(Array.from({ length: 8 }, () => ensurePlanningAlias(root)));
  assert.equal(new Set(aliases).size, 1);
  assert.equal(await realpath(aliases[0]), await realpath(join(root, '.openspec')));
  await writeFile(join(aliases[0], 'shared'), 'same store');
  assert.equal(await readFile(join(root, '.openspec/shared'), 'utf8'), 'same store');
});
test('refuses a real directory and preserves its files', async t => {
  const root = await fixture(t);
  await mkdir(join(root, 'openspec'));
  await writeFile(join(root, 'openspec/existing'), 'do not overwrite');
  await assert.rejects(ensurePlanningAlias(root), /real directory/);
  assert.equal(await readFile(join(root, 'openspec/existing'), 'utf8'), 'do not overwrite');
});
test('refuses wrong-target and broken aliases without replacing them', async t => {
  for (const broken of [false, true]) {
    const root = await fixture(t);
    const other = join(root, 'other');
    if (!broken) await mkdir(other);
    await link(other, join(root, 'openspec'));
    await assert.rejects(ensurePlanningAlias(root), broken ? /broken alias/ : /points elsewhere/);
    assert.equal((await lstat(join(root, 'openspec'))).isSymbolicLink(), true);
    assert.equal(await readFile(join(root, '.openspec/sentinel'), 'utf8'), 'preserve');
  }
});
test('forwards arguments, cwd and local config; preserves exit status and alias on failure', async t => {
  const root = await fixture(t);
  const cliPath = join(root, 'fixture-cli.cjs');
  await writeFile(cliPath, `const fs = require('node:fs');
    if (process.env.OPENSPEC_TELEMETRY !== '0' || !process.env.APPDATA.includes('CITRUS_WORLD')) process.exit(99);
    fs.writeFileSync('received.json', JSON.stringify(process.argv.slice(2)));
    process.exit(Number(process.argv[2]));`);
  for (const code of [0, 7]) {
    assert.equal(await runOpenSpec({ repoRoot: root, cliPath, args: [String(code), 'two words'] }), code);
    assert.deepEqual(JSON.parse(await readFile(join(root, 'received.json'), 'utf8')), [String(code), 'two words']);
    assert.equal(await realpath(join(root, 'openspec')), await realpath(join(root, '.openspec')));
  }
});
