import type { Maybe } from './maybe.js';
import type { ParseGitRemoteResult } from './parse-git-remote-result.js';

const SSH_RE = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/;
const HTTPS_RE = /^https?:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/;

export function parseGitRemote(url: string): Maybe<ParseGitRemoteResult> {
  const trimmed = url.trim();
  const ssh = SSH_RE.exec(trimmed);
  if (ssh) return { host: 'github', owner: ssh[1], repo: ssh[2] };
  const https = HTTPS_RE.exec(trimmed);
  if (https) return { host: 'github', owner: https[1], repo: https[2] };
  return null;
}
