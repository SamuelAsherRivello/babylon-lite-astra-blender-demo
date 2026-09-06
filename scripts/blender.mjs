import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const steam = 'D:/SteamLibrary/steamapps/common/Blender/blender.exe';
const local = join(root, '.local', 'tools');
const candidates = [
  process.env.BLENDER_PATH,
  steam,
  'C:/Program Files (x86)/Steam/steamapps/common/Blender/blender.exe',
  ...(existsSync(local) ? readdirSync(local).filter(name => name.startsWith('blender-')).map(name => join(local, name, 'blender.exe')) : []),
].filter(Boolean);
let executable = candidates.find(path => existsSync(path));
if (!executable && spawnSync('blender', ['--version'], { stdio: 'ignore' }).status === 0) executable = 'blender';
if (!executable) {
  console.error('Blender was not found. Set BLENDER_PATH to your Blender executable and rerun.');
  process.exit(1);
}
console.error(`Blender: ${executable}`);
const args = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === '--'));
const result = spawnSync(executable, args.length ? args : ['--version'], { cwd: root, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
