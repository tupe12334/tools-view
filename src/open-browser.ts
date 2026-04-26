import { execSync } from 'child_process';

export function openBrowser(filePath: string): void {
  const { TOOLSVIEW_NO_OPEN } = process.env;
  if (TOOLSVIEW_NO_OPEN === '1') return;
  const cmds: Partial<Record<NodeJS.Platform, string>> = {
    darwin: `open "${filePath}"`,
    win32: `start "" "${filePath}"`,
  };
  const platformCmd = cmds[process.platform];
  const cmd = platformCmd !== undefined ? platformCmd : `xdg-open "${filePath}"`;
  try {
    execSync(cmd);
  } catch {
    /* ignore */
  }
}
