import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findAgentsDir } from './find-agents-dir.js';

describe('findAgentsDir', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolsview-agents-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('finds .claude/agents in given dir', () => {
    const agentsDir = path.join(tmpDir, '.claude', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    expect(findAgentsDir(tmpDir)).toBe(agentsDir);
  });

  it('finds .claude/agents in parent dir', () => {
    const agentsDir = path.join(tmpDir, '.claude', 'agents');
    fs.mkdirSync(agentsDir, { recursive: true });
    const child = path.join(tmpDir, 'child');
    fs.mkdirSync(child);
    expect(findAgentsDir(child)).toBe(agentsDir);
  });

  it('returns null when .claude/agents is a file not dir', () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir);
    fs.writeFileSync(path.join(claudeDir, 'agents'), 'not a dir');
    expect(findAgentsDir(tmpDir)).toBeNull();
  });

  it('returns null when nothing found up to root', () => {
    expect(findAgentsDir(tmpDir)).toBeNull();
  });
});
