import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import {
  parseFrontmatter,
  classifyRef,
  extractEdges,
  buildHtml,
  findSkillsDir,
  openBrowser,
  main,
  TYPE_PRIORITY,
} from './lib.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));

// ---------------------------------------------------------------------------
// TYPE_PRIORITY
// ---------------------------------------------------------------------------

describe('TYPE_PRIORITY', () => {
  it('prerequisite > calls > suggests > references', () => {
    expect(TYPE_PRIORITY.prerequisite).toBeGreaterThan(TYPE_PRIORITY.calls);
    expect(TYPE_PRIORITY.calls).toBeGreaterThan(TYPE_PRIORITY.suggests);
    expect(TYPE_PRIORITY.suggests).toBeGreaterThan(TYPE_PRIORITY.references);
  });
});

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------

describe('parseFrontmatter', () => {
  it('returns empty meta and full content when no frontmatter', () => {
    const result = parseFrontmatter('just content');
    expect(result.meta).toEqual({});
    expect(result.body).toBe('just content');
  });

  it('parses key-value pairs', () => {
    const result = parseFrontmatter('---\nname: test\ndescription: a test\n---\nbody content');
    expect(result.meta).toEqual({ name: 'test', description: 'a test' });
    expect(result.body).toBe('body content');
  });

  it('skips lines without colon', () => {
    const result = parseFrontmatter('---\nname: test\nnocolon\n---\nbody');
    expect(result.meta).toEqual({ name: 'test' });
  });

  it('skips lines with empty key', () => {
    const result = parseFrontmatter('---\n: value\nname: test\n---\nbody');
    expect(result.meta).toEqual({ name: 'test' });
  });

  it('handles CRLF line endings', () => {
    const result = parseFrontmatter('---\r\nname: test\r\n---\r\nbody');
    expect(result.meta).toEqual({ name: 'test' });
    expect(result.body).toBe('body');
  });

  it('handles value with colon inside', () => {
    const result = parseFrontmatter('---\nurl: http://example.com\n---\nbody');
    expect(result.meta).toEqual({ url: 'http://example.com' });
  });

  it('empty body after frontmatter', () => {
    const result = parseFrontmatter('---\nname: x\n---\n');
    expect(result.body).toBe('');
  });
});

// ---------------------------------------------------------------------------
// classifyRef
// ---------------------------------------------------------------------------

describe('classifyRef', () => {
  describe('prerequisite', () => {
    it('"prerequisite"', () => expect(classifyRef('This is a prerequisite')).toBe('prerequisite'));
    it('"run" + "before"', () => expect(classifyRef('run this before using')).toBe('prerequisite'));
    it('"require"', () => expect(classifyRef('you require this skill')).toBe('prerequisite'));
    it('"must have"', () => expect(classifyRef('you must have this active')).toBe('prerequisite'));
    it('"ensure"', () => expect(classifyRef('ensure this is done')).toBe('prerequisite'));
    it('"active session"', () => expect(classifyRef('needs active session')).toBe('prerequisite'));
  });

  describe('calls', () => {
    it('"full logic in"', () => expect(classifyRef('full logic in this skill')).toBe('calls'));
    it('"apply those instructions"', () => expect(classifyRef('apply those instructions')).toBe('calls'));
    it('"calls"', () => expect(classifyRef('this skill calls')).toBe('calls'));
    it('"using"', () => expect(classifyRef('using this')).toBe('calls'));
    it('"invokes"', () => expect(classifyRef('it invokes the handler')).toBe('calls'));
    it('"step" + "run"', () => expect(classifyRef('step 1 run the command')).toBe('calls'));
  });

  describe('suggests', () => {
    it('"suggest"', () => expect(classifyRef('suggest running this')).toBe('suggests'));
    it('"next step"', () => expect(classifyRef('next step is to do')).toBe('suggests'));
    it('"next:"', () => expect(classifyRef('next: run this')).toBe('suggests'));
    it('"then run"', () => expect(classifyRef('then run the skill')).toBe('suggests'));
    it('"guide" + "run"', () => expect(classifyRef('guide the user to run this')).toBe('suggests'));
  });

  describe('references (default)', () => {
    it('unmatched context', () => expect(classifyRef('see also for more info')).toBe('references'));
    it('empty string', () => expect(classifyRef('')).toBe('references'));
  });
});

// ---------------------------------------------------------------------------
// extractEdges
// ---------------------------------------------------------------------------

describe('extractEdges', () => {
  it('returns empty for no matches', () => {
    expect(extractEdges('a', 'no skill refs here', ['b', 'c'])).toEqual([]);
  });

  it('skips self-reference', () => {
    expect(extractEdges('a', 'use /a here', ['a'])).toEqual([]);
  });

  it('extracts a references edge', () => {
    const edges = extractEdges('a', 'see /b for details', ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'a', to: 'b', type: 'references' });
  });

  it('extracts prerequisite edge', () => {
    const edges = extractEdges('a', 'prerequisite: use /b', ['a', 'b']);
    expect(edges[0].type).toBe('prerequisite');
  });

  it('extracts calls edge', () => {
    const edges = extractEdges('a', 'calls /b for processing', ['a', 'b']);
    expect(edges[0].type).toBe('calls');
  });

  it('extracts suggests edge', () => {
    const edges = extractEdges('a', 'suggest running /b next', ['a', 'b']);
    expect(edges[0].type).toBe('suggests');
  });

  it('keeps highest priority across multiple matches of same target', () => {
    const body = 'see /b ... calls /b';
    const edges = extractEdges('a', body, ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0].type).toBe('calls');
  });

  it('does not upgrade when lower priority found after higher', () => {
    const body = 'prerequisite: /b ... see also /b';
    const edges = extractEdges('a', body, ['a', 'b']);
    expect(edges[0].type).toBe('prerequisite');
  });

  it('does not match partial skill ids', () => {
    expect(extractEdges('a', 'see /bc for details', ['a', 'b'])).toHaveLength(0);
  });

  it('matches skill id at end of string', () => {
    const edges = extractEdges('a', 'see /b', ['a', 'b']);
    expect(edges).toHaveLength(1);
  });

  it('uses full 120-char context window for classification', () => {
    const padding = 'x'.repeat(150);
    const body = `prerequisite ${padding}/b`;
    const edges = extractEdges('a', body, ['a', 'b']);
    // prerequisite keyword is outside 120-char window, so defaults to references
    expect(edges[0].type).toBe('references');
  });

  it('extracts edges for multiple targets', () => {
    const edges = extractEdges('a', 'see /b and /c here', ['a', 'b', 'c']);
    expect(edges).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// buildHtml
// ---------------------------------------------------------------------------

describe('buildHtml', () => {
  it('replaces __GRAPH_DATA__ with JSON', () => {
    const graph = { generated: '2024-01-01T00:00:00.000Z', skillsDir: 'skills', nodes: [], edges: [] };
    const html = buildHtml(graph);
    expect(html).toContain(JSON.stringify(graph));
    expect(html).not.toContain('__GRAPH_DATA__');
  });

  it('returns string containing template content', () => {
    const graph = { generated: '', skillsDir: '', nodes: [], edges: [] };
    const html = buildHtml(graph);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(100);
  });
});

// ---------------------------------------------------------------------------
// findSkillsDir
// ---------------------------------------------------------------------------

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
});

// ---------------------------------------------------------------------------
// openBrowser
// ---------------------------------------------------------------------------

describe('openBrowser', () => {
  const mockedExecSync = vi.mocked(execSync);

  beforeEach(() => mockedExecSync.mockReset());

  it('uses "open" on darwin', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('open "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('uses "start" on win32', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('start "" "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('uses "xdg-open" on linux', () => {
    const orig = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    openBrowser('/tmp/graph.html');
    expect(mockedExecSync).toHaveBeenCalledWith('xdg-open "/tmp/graph.html"');
    Object.defineProperty(process, 'platform', { value: orig, configurable: true });
  });

  it('silently ignores execSync errors', () => {
    mockedExecSync.mockImplementationOnce(() => { throw new Error('no browser'); });
    expect(() => openBrowser('/tmp/graph.html')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

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
      throw new Error(`exit:${code}`);
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
    expect(() => main()).toThrow('exit:1');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('no .claude/skills/'));
  });

  it('exits with 1 when skills dir has no skills', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    expect(() => main()).toThrow('exit:1');
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('no skills found'));
  });

  it('ignores entries that are files (not dirs)', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), '');
    expect(() => main()).toThrow('exit:1');
  });

  it('ignores dirs without SKILL.md', () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills');
    const skillDir = path.join(skillsDir, 'my-skill');
    fs.mkdirSync(skillDir, { recursive: true });
    expect(() => main()).toThrow('exit:1');
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
    makeSkill(skillsDir, 'my-skill', '---\nname: My Skill\ndescription: Does stuff\nallowed-tools: Bash, Read\n---\nbody');

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
    const count = (gi.match(/graph\.html/g) ?? []).length;
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
