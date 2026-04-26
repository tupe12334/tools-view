import { describe, expect, it } from 'vitest';
import { extractSkillCallEdges } from './extract-skill-call-edges.js';

describe('extractSkillCallEdges', () => {
  it('returns empty when no Skill() calls', () => {
    expect(extractSkillCallEdges('a', 'just plain text', ['a', 'b'])).toEqual([]);
  });

  it('extracts a calls edge from Skill() syntax', () => {
    const edges = extractSkillCallEdges('a', 'Skill(skill="b", args="X Y")', ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'a', to: 'b', type: 'calls' });
  });

  it('skips self-reference', () => {
    expect(extractSkillCallEdges('a', 'Skill(skill="a")', ['a'])).toHaveLength(0);
  });

  it('ignores unknown skill ids', () => {
    expect(extractSkillCallEdges('a', 'Skill(skill="unknown")', ['a', 'b'])).toHaveLength(0);
  });

  it('extracts multiple edges for multiple targets', () => {
    const body = 'Skill(skill="b") and Skill(skill="c")';
    const edges = extractSkillCallEdges('a', body, ['a', 'b', 'c']);
    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.to).sort()).toEqual(['b', 'c']);
  });

  it('returns duplicate edges when same target appears twice', () => {
    const body = 'Skill(skill="b") ... Skill(skill="b")';
    const edges = extractSkillCallEdges('a', body, ['a', 'b']);
    expect(edges).toHaveLength(2);
  });

  it('matches keyword case-insensitively', () => {
    const edges = extractSkillCallEdges('a', 'skill(skill="b")', ['a', 'b']);
    expect(edges[0].type).toBe('calls');
  });

  it('handles whitespace around = and value', () => {
    const edges = extractSkillCallEdges('a', 'Skill( skill = "b" )', ['a', 'b']);
    expect(edges[0].to).toBe('b');
  });

  it('extracts edge from Agent() prompt with single-quoted skill arg', () => {
    const body = `Agent(\n  subagent_type: general-purpose\n  prompt: "Use the Skill tool to invoke skill='b' with args='X | Y'."\n)`;
    const edges = extractSkillCallEdges('a', body, ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ from: 'a', to: 'b', type: 'calls' });
  });

  it('extracts edge from Agent() prompt with double-quoted skill arg', () => {
    const body = `Agent(prompt: 'invoke skill="b" please')`;
    const edges = extractSkillCallEdges('a', body, ['a', 'b']);
    expect(edges).toHaveLength(1);
    expect(edges[0].to).toBe('b');
  });
});
