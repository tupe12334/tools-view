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

function countImmediateSkillDirs(dir: string): number {
  let n = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const skillFile = path.join(dir, e.name, 'SKILL.md');
    if (fs.existsSync(skillFile) && fs.statSync(skillFile).isFile()) n++;
  }
  return n;
}

function checkCandidate(dir: string): Maybe<string> {
  const claudeCandidate = path.join(dir, '.claude', 'skills');
  if (isDir(claudeCandidate)) return claudeCandidate;
  const topCandidate = path.join(dir, 'skills');
  if (isDir(topCandidate) && containsSkill(topCandidate)) return topCandidate;
  if (countImmediateSkillDirs(dir) >= 2) return dir;
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
