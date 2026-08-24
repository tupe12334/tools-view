import open from 'open';

export function openBrowser(filePath: string): void {
  const { TOOLSVIEW_NO_OPEN } = process.env;
  if (TOOLSVIEW_NO_OPEN === '1') return;
  open(filePath).catch(() => {
    /* ignore */
  });
}
