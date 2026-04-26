import { execSync } from 'child_process';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openBrowser } from './open-browser.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));

describe('openBrowser', () => {
  const mockedExecSync = vi.mocked(execSync);

  beforeEach(() => {
    mockedExecSync.mockReset();
  });

  it('uses "open" on darwin', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('open "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('uses "start" on win32', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('start "" "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('uses "xdg-open" on linux', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('xdg-open "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('skips when TOOLSVIEW_NO_OPEN=1', () => {
    const orig = process.env.TOOLSVIEW_NO_OPEN;
    process.env.TOOLSVIEW_NO_OPEN = '1';
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).not.toHaveBeenCalled();
    if (orig === undefined) delete process.env.TOOLSVIEW_NO_OPEN;
    else process.env.TOOLSVIEW_NO_OPEN = orig;
  });

  it('silently ignores execSync errors', () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('no browser');
    });
    expect(() => { openBrowser('/tmp/graph.html'); }).not.toThrow();
  });
});
