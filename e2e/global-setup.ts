import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function globalSetup(): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const examplesDir = path.resolve(here, '..', 'examples');
  const cli = path.resolve(here, '..', 'dist', 'index.js');
  execSync(`node "${cli}"`, {
    cwd: examplesDir,
    env: { ...process.env, TOOLSVIEW_NO_OPEN: '1' },
    stdio: 'inherit',
  });
}
