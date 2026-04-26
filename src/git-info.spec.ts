import { execSync } from 'child_process';
import { describe, expect, it, vi } from 'vitest';
import { getGitInfo } from './git-info.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));

const mockedExec = vi.mocked(execSync);

function mockResponses(map: Record<string, string | Error>): void {
  mockedExec.mockReset();
  mockedExec.mockImplementation((cmd: string) => {
    for (const key of Object.keys(map)) {
      if (cmd !== key) continue;
      const v = map[key];
      if (v instanceof Error) throw v;
      return Buffer.from(v);
    }
    throw new Error('unmocked: ' + cmd);
  });
}

describe('getGitInfo', () => {
  it('returns null when not a git repo', () => {
    mockResponses({ 'git rev-parse --show-toplevel': new Error('not a repo') });
    expect(getGitInfo('/tmp')).toBeNull();
  });

  it('returns null when no origin remote', () => {
    mockResponses({
      'git rev-parse --show-toplevel': '/repo\n',
      'git remote get-url origin': new Error('no remote'),
    });
    expect(getGitInfo('/repo')).toBeNull();
  });

  it('returns null when remote not parseable as github', () => {
    mockResponses({
      'git rev-parse --show-toplevel': '/repo\n',
      'git remote get-url origin': 'git@gitlab.com:a/b.git\n',
    });
    expect(getGitInfo('/repo')).toBeNull();
  });

  it('parses repo root, owner, repo, branch', () => {
    mockResponses({
      'git rev-parse --show-toplevel': '/repo\n',
      'git remote get-url origin': 'git@github.com:owner/name.git\n',
      'git rev-parse --abbrev-ref HEAD': 'feature/x\n',
    });
    expect(getGitInfo('/repo')).toEqual({
      repoRoot: '/repo',
      host: 'github',
      owner: 'owner',
      repo: 'name',
      branch: 'feature/x',
    });
  });

  it('falls back to main when branch is HEAD (detached)', () => {
    mockResponses({
      'git rev-parse --show-toplevel': '/repo\n',
      'git remote get-url origin': 'https://github.com/o/n.git\n',
      'git rev-parse --abbrev-ref HEAD': 'HEAD\n',
    });
    expect(getGitInfo('/repo')?.branch).toBe('main');
  });

  it('falls back to main when branch query fails', () => {
    mockResponses({
      'git rev-parse --show-toplevel': '/repo\n',
      'git remote get-url origin': 'https://github.com/o/n\n',
      'git rev-parse --abbrev-ref HEAD': new Error('fail'),
    });
    expect(getGitInfo('/repo')?.branch).toBe('main');
  });
});
