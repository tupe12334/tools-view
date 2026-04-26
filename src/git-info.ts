import { execSync } from 'child_process';
import type { GitInfo } from './git-info-type.js';
import type { Maybe } from './maybe.js';
import { parseGitRemote } from './parse-git-remote.js';

function safeExec(cmd: string, cwd: string): Maybe<string> {
  try {
    return execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

export function getGitInfo(cwd: string): Maybe<GitInfo> {
  const repoRoot = safeExec('git rev-parse --show-toplevel', cwd);
  if (repoRoot === null || repoRoot === '') return null;
  const remote = safeExec('git remote get-url origin', cwd);
  if (remote === null) return null;
  const parsed = parseGitRemote(remote);
  if (parsed === null) return null;
  let branch = safeExec('git rev-parse --abbrev-ref HEAD', cwd);
  if (branch === null || branch === '' || branch === 'HEAD') branch = 'main';
  return { repoRoot, host: parsed.host, owner: parsed.owner, repo: parsed.repo, branch };
}
