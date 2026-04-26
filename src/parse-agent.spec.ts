import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseAgent } from './parse-agent.js';

describe('parseAgent', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'parse-agent-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('parses agent with bracket tools syntax', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'my-agent.md'),
      '---\nname: My Agent\ndescription: Does stuff\ntools: [Bash, Read]\n---\nbody',
    );
    const result = parseAgent(tmpDir, 'my-agent.md');
    expect(result.id).toBe('my-agent');
    expect(result.name).toBe('My Agent');
    expect(result.description).toBe('Does stuff');
    expect(result.allowedTools).toEqual(['Bash', 'Read']);
    expect(result.body).toBe('body');
  });

  it('parses agent with comma-separated tools', () => {
    fs.writeFileSync(path.join(tmpDir, 'agent.md'), '---\ntools: Bash, Read\n---\nbody');
    const result = parseAgent(tmpDir, 'agent.md');
    expect(result.allowedTools).toEqual(['Bash', 'Read']);
  });

  it('uses id as name and empty values when no frontmatter', () => {
    fs.writeFileSync(path.join(tmpDir, 'my-agent.md'), 'just body');
    const result = parseAgent(tmpDir, 'my-agent.md');
    expect(result.id).toBe('my-agent');
    expect(result.name).toBe('my-agent');
    expect(result.description).toBe('');
    expect(result.allowedTools).toEqual([]);
  });
});
