import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openBrowser } from './open-browser.js';

const mockOpen = vi.fn(async (_path: string) => Promise.resolve(undefined));
vi.mock('open', () => ({ default: async (path: string): Promise<undefined> => mockOpen(path) }));

describe('openBrowser', () => {
  beforeEach(() => {
    mockOpen.mockReset();
    mockOpen.mockImplementation(async (_path: string) => Promise.resolve(undefined));
  });

  it('opens the given path', () => {
    openBrowser('/tmp/graph.html');
    expect(mockOpen).toHaveBeenCalledWith('/tmp/graph.html');
  });

  it('skips when TOOLSVIEW_NO_OPEN=1', () => {
    const env = process.env;
    const { TOOLSVIEW_NO_OPEN: orig } = env;
    env.TOOLSVIEW_NO_OPEN = '1';
    openBrowser('/tmp/graph.html');
    expect(mockOpen).not.toHaveBeenCalled();
    if (orig === undefined) delete env.TOOLSVIEW_NO_OPEN;
    else env.TOOLSVIEW_NO_OPEN = orig;
  });

  it('silently ignores rejection', () => {
    mockOpen.mockRejectedValueOnce(new Error('no browser'));
    expect(() => { openBrowser('/tmp/graph.html'); }).not.toThrow();
  });
});
