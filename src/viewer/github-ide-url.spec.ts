import { describe, expect, it } from 'vitest';
import type { GitInfo } from '../git-info-type.js';
import { githubIdeUrl } from './github-ide-url.js';

const git: GitInfo = {
  repoRoot: '/repo',
  host: 'github',
  owner: 'tupe12334',
  repo: 'tools-view',
  branch: 'main',
};

describe('githubIdeUrl', () => {
  it('builds github.dev blob URL preserving path separators', () => {
    expect(githubIdeUrl(git, '.claude/skills/foo/SKILL.md')).toBe(
      'https://github.dev/tupe12334/tools-view/blob/main/.claude/skills/foo/SKILL.md',
    );
  });

  it('encodes branch with slashes', () => {
    expect(githubIdeUrl({ ...git, branch: 'feature/x' }, 'a/b.md')).toBe(
      'https://github.dev/tupe12334/tools-view/blob/feature%2Fx/a/b.md',
    );
  });

  it('encodes spaces and special characters in path segments', () => {
    expect(githubIdeUrl(git, 'dir with space/file?.md')).toBe(
      'https://github.dev/tupe12334/tools-view/blob/main/dir%20with%20space/file%3F.md',
    );
  });
});
