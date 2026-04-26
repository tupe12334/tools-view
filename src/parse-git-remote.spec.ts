import { describe, expect, it } from 'vitest';
import { parseGitRemote } from './parse-git-remote.js';

describe('parseGitRemote', () => {
  it('parses ssh remote with .git suffix', () => {
    expect(parseGitRemote('git@github.com:tupe12334/tools-view.git')).toEqual({
      host: 'github',
      owner: 'tupe12334',
      repo: 'tools-view',
    });
  });

  it('parses ssh remote without .git suffix', () => {
    expect(parseGitRemote('git@github.com:owner/name')).toEqual({
      host: 'github',
      owner: 'owner',
      repo: 'name',
    });
  });

  it('parses https remote', () => {
    expect(parseGitRemote('https://github.com/owner/repo.git')).toEqual({
      host: 'github',
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('parses http remote without .git suffix', () => {
    expect(parseGitRemote('http://github.com/owner/repo')).toEqual({
      host: 'github',
      owner: 'owner',
      repo: 'repo',
    });
  });

  it('trims whitespace and newline', () => {
    expect(parseGitRemote('  git@github.com:a/b.git\n')).toEqual({
      host: 'github',
      owner: 'a',
      repo: 'b',
    });
  });

  it('returns null for non-github remotes', () => {
    expect(parseGitRemote('git@gitlab.com:a/b.git')).toBeNull();
    expect(parseGitRemote('https://bitbucket.org/a/b')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(parseGitRemote('not a url')).toBeNull();
  });
});
