import fs from 'fs';
import path from 'path';
import type { Maybe } from './maybe.js';

function isDir(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function containsSkill(dir: string): boolean {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isFile() && e.name === 'SKILL.md') return true;
  }
  for (const e of entries) {
    if (e.isDirectory() && containsSkill(path.join(dir, e.name))) return true;
  }
  return false;
}

function checkCandidate(dir: string): Maybe<string> {
  const claudeCandidate = path.join(dir, '.claude', 'skills');
  if (isDir(claudeCandidate)) return claudeCandidate;
  const topCandidate = path.join(dir, 'skills');
  if (isDir(topCandidate) && containsSkill(topCandidate)) return topCandidate;
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
