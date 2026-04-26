import { describe, expect, it } from 'vitest';
import { parseToolsList } from './parse-tools-list.js';

describe('parseToolsList', () => {
  it('parses comma-separated string', () => {
    expect(parseToolsList('Read, Bash, Write')).toEqual(['Read', 'Bash', 'Write']);
  });

  it('parses bracket array syntax', () => {
    expect(parseToolsList('[Read, Bash, Write]')).toEqual(['Read', 'Bash', 'Write']);
  });

  it('trims whitespace around entries', () => {
    expect(parseToolsList(' Read , Bash ')).toEqual(['Read', 'Bash']);
  });

  it('returns empty array for empty string', () => {
    expect(parseToolsList('')).toEqual([]);
  });

  it('returns empty array for empty brackets', () => {
    expect(parseToolsList('[]')).toEqual([]);
  });

  it('handles single tool', () => {
    expect(parseToolsList('Bash')).toEqual(['Bash']);
  });
});
