import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseSkill } from './parse-skill.js';

describe('parseSkill', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parse-skill-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('parses skill with frontmatter', () => {
    const skillDir = path.join(tmpDir, 'my-skill');
    fs.mkdirSync(skillDir);
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      '---\nname: Test\ndescription: Desc\nallowed-tools: Bash, Read\n---\nbody',
    );
    const result = parseSkill(tmpDir, 'my-skill');
    expect(result.name).toBe('Test');
    expect(result.description).toBe('Desc');
    expect(result.allowedTools).toEqual(['Bash', 'Read']);
    expect(result.body).toBe('body');
    expect(result.filePath).toBe(path.join(tmpDir, 'my-skill', 'SKILL.md'));
  });

  it('uses id as name and empty values when no frontmatter', () => {
    const skillDir = path.join(tmpDir, 'my-skill');
    fs.mkdirSync(skillDir);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'just body');
    const result = parseSkill(tmpDir, 'my-skill');
    expect(result.id).toBe('my-skill');
    expect(result.name).toBe('my-skill');
    expect(result.description).toBe('');
    expect(result.allowedTools).toEqual([]);
    expect(result.body).toBe('just body');
  });
});
