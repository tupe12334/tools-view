import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { main } from './main.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));

describe('main', () => {
  let tmpDir: string;
  const mockedExecSync = vi.mocked(execSync);
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolsview-main-'));
    mockedExecSync.mockReset();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
      throw new Error(`exit:${String(code)}`);
    });
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
    cwdSpy.mockRestore();
  });

  it('exits with 1 when no skills dir found', () => {
    expect(() => { main(); }).toThrow('exit:1');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('no .claude/skills/'));
  });

  it('exits with 1 when skills dir has no skills', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    expect(() => { main(); }).toThrow('exit:1');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('no skills found'));
  });

  it('ignores entries that are files (not dirs)', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), '');
    expect(() => { main(); }).toThrow('exit:1');
  });

  it('ignores dirs without SKILL.md', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    const skillDir = path.join(skillsDir, 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    expect(() => { main(); }).toThrow('exit:1');
  });

  function makeSkill(skillsDir: string, id: string, content: string) {
    const dir = path.join(skillsDir, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), content);
  }

  it('runs successfully with minimal skill (no frontmatter)', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'my-skill', 'Just a body with no frontmatter');

    main();

    const graphDir = path.join(tmpDir, '.claude', 'graph');
    expect(fs.existsSync(path.join(graphDir, 'graph.json'))).toBe(true);
    expect(fs.existsSync(path.join(graphDir, 'graph.html'))).toBe(true);
    expect(fs.existsSync(path.join(graphDir, '.gitignore'))).toBe(true);

    const json = JSON.parse(fs.readFileSync(path.join(graphDir, 'graph.json'), 'utf-8'));
    expect(json.nodes).toHaveLength(1);
    expect(json.nodes[0].id).toBe('my-skill');
    expect(json.nodes[0].name).toBe('my-skill');
    expect(json.nodes[0].description).toBe('');
    expect(json.nodes[0].allowedTools).toEqual([]);
  });

  it('uses name/description/allowed-tools from frontmatter', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(
      skillsDir,
      'my-skill',
      '---\nname: My Skill\ndescription: Does stuff\nallowed-tools: Bash, Read\n---\nbody',
    );

    main();

    const graphDir = path.join(tmpDir, '.claude', 'graph');
    const json = JSON.parse(fs.readFileSync(path.join(graphDir, 'graph.json'), 'utf-8'));
    expect(json.nodes[0].name).toBe('My Skill');
    expect(json.nodes[0].description).toBe('Does stuff');
    expect(json.nodes[0].allowedTools).toEqual(['Bash', 'Read']);
  });

  it('extracts edges between skills', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'skill-a', '---\nname: A\n---\ncalls /skill-b here');
    makeSkill(skillsDir, 'skill-b', '---\nname: B\n---\njust body');

    main();

    const graphDir = path.join(tmpDir, '.claude', 'graph');
    const json = JSON.parse(fs.readFileSync(path.join(graphDir, 'graph.json'), 'utf-8'));
    expect(json.edges).toHaveLength(1);
    expect(json.edges[0]).toMatchObject({ from: 'skill-a', to: 'skill-b', type: 'calls' });
  });

  it('does not append graph.html to .gitignore when already present', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'my-skill', 'body');

    const graphDir = path.join(tmpDir, '.claude', 'graph');
    fs.mkdirSync(graphDir, { recursive: true });
    fs.writeFileSync(path.join(graphDir, '.gitignore'), 'graph.json\ngraph.html\n');

    main();

    const gi = fs.readFileSync(path.join(graphDir, '.gitignore'), 'utf-8');
    const countMatches = gi.match(/graph\.html/g);
    const count = countMatches !== null ? countMatches.length : 0;
    expect(count).toBe(1);
  });

  it('appends graph.html to .gitignore when missing from existing file', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'my-skill', 'body');

    const graphDir = path.join(tmpDir, '.claude', 'graph');
    fs.mkdirSync(graphDir, { recursive: true });
    fs.writeFileSync(path.join(graphDir, '.gitignore'), 'graph.json\n');

    main();

    const gi = fs.readFileSync(path.join(graphDir, '.gitignore'), 'utf-8');
    expect(gi).toContain('graph.html');
  });

  it('writes skills count to stderr', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'my-skill', 'body');

    main();

    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('Skills: 1'));
  });

  it('calls openBrowser with html path', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    makeSkill(skillsDir, 'my-skill', 'body');

    main();

    expect(mockedExecSync).toHaveBeenCalled();
  });
});
