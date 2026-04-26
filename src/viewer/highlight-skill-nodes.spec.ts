import { describe, it, expect } from 'vitest';
import { highlightSkillNodes } from './highlight-skill-nodes.js';

describe('highlightSkillNodes', () => {
  it('returns input unchanged when no skill ids match', () => {
    const code = 'graph TD\n  foo[Foo] --> bar[Bar]';
    expect(highlightSkillNodes(code, new Set(['baz']))).toBe(code);
  });

  it('appends a style block for each matched id', () => {
    const code = 'graph TD\n  foo[Foo] --> bar[Bar]';
    const out = highlightSkillNodes(code, new Set(['foo', 'bar']));
    expect(out.startsWith(code)).toBe(true);
    expect(out).toContain('style foo fill:#2d5a3d');
    expect(out).toContain('bar fill:#2d5a3d');
  });
});
