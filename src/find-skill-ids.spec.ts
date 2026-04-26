import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findSkillIds } from './find-skill-ids.js';

describe('findSkillIds', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolsview-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('finds direct children with SKILL.md', () => {
    const a = path.join(tmpDir, 'a');
    fs.mkdirSync(a);
    fs.writeFileSync(path.join(a, 'SKILL.md'), '---\nname: a\n---\n');
    const result = findSkillIds(tmpDir);
    expect(result).toEqual([{ id: 'a', parentDir: tmpDir }]);
  });

  it('finds skills nested under category dirs', () => {
    const cat = path.join(tmpDir, 'cloud');
    const skill = path.join(cat, 'db-basics');
    fs.mkdirSync(skill, { recursive: true });
    fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: db-basics\n---\n');
    const result = findSkillIds(tmpDir);
    expect(result).toEqual([{ id: 'db-basics', parentDir: cat }]);
  });

  it('deduplicates by basename across categories', () => {
    const a = path.join(tmpDir, 'cat-a', 'dup');
    const b = path.join(tmpDir, 'cat-b', 'dup');
    fs.mkdirSync(a, { recursive: true });
    fs.mkdirSync(b, { recursive: true });
    fs.writeFileSync(path.join(a, 'SKILL.md'), '---\nname: dup\n---\n');
    fs.writeFileSync(path.join(b, 'SKILL.md'), '---\nname: dup\n---\n');
    const result = findSkillIds(tmpDir);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('dup');
  });

  it('does not descend into a skill dir', () => {
    const skill = path.join(tmpDir, 'parent');
    const child = path.join(skill, 'child');
    fs.mkdirSync(child, { recursive: true });
    fs.writeFileSync(path.join(skill, 'SKILL.md'), '---\nname: parent\n---\n');
    fs.writeFileSync(path.join(child, 'SKILL.md'), '---\nname: child\n---\n');
    const result = findSkillIds(tmpDir);
    expect(result).toEqual([{ id: 'parent', parentDir: tmpDir }]);
  });
});
