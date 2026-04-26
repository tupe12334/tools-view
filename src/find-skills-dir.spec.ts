import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findSkillsDir } from './find-skills-dir.js';

describe('findSkillsDir', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolsview-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('finds .claude/skills in given dir', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    expect(findSkillsDir(tmpDir)).toBe(skillsDir);
  });

  it('finds .claude/skills in parent dir', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    const child = path.join(tmpDir, 'child');
    fs.mkdirSync(child);
    expect(findSkillsDir(child)).toBe(skillsDir);
  });

  it('returns null when .claude/skills is a file not dir', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir);
    fs.writeFileSync(path.join(claudeDir, 'skills'), 'not a dir');
    expect(findSkillsDir(tmpDir)).toBeNull();
  });

  it('returns null when nothing found up to root', () => {
    expect(findSkillsDir(tmpDir)).toBeNull();
  });

  it('finds top-level skills/ dir when it contains SKILL.md', () => {
    const skillsDir = path.join(tmpDir, 'skills');
    const skillDir = path.join(skillsDir, 'cloud', 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '---\nname: my-skill\n---\nbody');
    expect(findSkillsDir(tmpDir)).toBe(skillsDir);
  });

  it('finds flat-layout repo where skills are top-level dirs', () => {
    const a = path.join(tmpDir, 'browse');
    const b = path.join(tmpDir, 'review');
    fs.mkdirSync(a, { recursive: true });
    fs.mkdirSync(b, { recursive: true });
    fs.writeFileSync(path.join(a, 'SKILL.md'), '---\nname: browse\n---\nbody');
    fs.writeFileSync(path.join(b, 'SKILL.md'), '---\nname: review\n---\nbody');
    expect(findSkillsDir(tmpDir)).toBe(tmpDir);
  });

  it('skips hidden dirs and node_modules when counting flat-layout siblings', () => {
    const a = path.join(tmpDir, 'browse');
    const b = path.join(tmpDir, 'review');
    const hidden = path.join(tmpDir, '.cache');
    const nm = path.join(tmpDir, 'node_modules', 'pkg');
    const file = path.join(tmpDir, 'README.md');
    fs.mkdirSync(a);
    fs.mkdirSync(b);
    fs.mkdirSync(hidden);
    fs.mkdirSync(nm, { recursive: true });
    fs.writeFileSync(path.join(a, 'SKILL.md'), '---\nname: a\n---\n');
    fs.writeFileSync(path.join(b, 'SKILL.md'), '---\nname: b\n---\n');
    fs.writeFileSync(path.join(hidden, 'SKILL.md'), '---\nname: c\n---\n');
    fs.writeFileSync(path.join(nm, 'SKILL.md'), '---\nname: d\n---\n');
    fs.writeFileSync(file, 'readme');
    expect(findSkillsDir(tmpDir)).toBe(tmpDir);
  });

  it('ignores single top-level dir with SKILL.md (not a flat-layout repo)', () => {
    const a = path.join(tmpDir, 'one');
    fs.mkdirSync(a, { recursive: true });
    fs.writeFileSync(path.join(a, 'SKILL.md'), '---\nname: one\n---\nbody');
    expect(findSkillsDir(tmpDir)).toBeNull();
  });

  it('ignores top-level skills/ dir without any SKILL.md', () => {
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'sub'), { recursive: true });
    expect(findSkillsDir(tmpDir)).toBeNull();
  });
});
