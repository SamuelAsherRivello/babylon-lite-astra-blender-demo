import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const python = join(root, '.local', 'blender-mcp', 'venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
if (!existsSync(python)) {
  console.error('Run python scripts/setup-blender-mcp.py before starting Blender MCP.');
  process.exit(1);
}
const child = spawn(python, ['-c', 'from blender_mcp.server import main; main()'], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    DISABLE_TELEMETRY: 'true', BLENDER_HOST: '127.0.0.1', BLENDER_PORT: '9876', PYTHONUTF8: '1',
    APPDATA: join(root, '.local', 'blender-mcp', 'appdata'),
    XDG_CONFIG_HOME: join(root, '.local', 'blender-mcp', 'config'),
    XDG_DATA_HOME: join(root, '.local', 'blender-mcp', 'data'),
  },
});
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
