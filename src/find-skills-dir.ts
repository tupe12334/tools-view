import fs from 'fs';
import path from 'path';
import type { Maybe } from './maybe.js';

function checkCandidate(dir: string): Maybe<string> {
  const candidate = path.join(dir, '.claude', 'skills');
  if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
    return candidate;
  }
  return null;
}

export function findSkillsDir(startDir: string): Maybe<string> {
  let dir = startDir;
  let parent = path.dirname(dir);
  while (dir !== parent) {
    const found = checkCandidate(dir);
    if (found !== null) return found;
    dir = parent;
    parent = path.dirname(dir);
  }
  return checkCandidate(dir);
}
