import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from './parse-frontmatter.js';

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

  it('parses a block-sequence list into an array', () => {
    const result = parseFrontmatter('---\ntools:\n  - Read\n  - Write\n---\nbody');
    expect(result.meta).toEqual({ tools: ['Read', 'Write'] });
    expect(result.body).toBe('body');
  });

  it('parses a quoted scalar value', () => {
    const result = parseFrontmatter('---\ntitle: "quoted: value"\n---\nbody');
    expect(result.meta).toEqual({ title: 'quoted: value' });
  });

  it('parses a multi-line block scalar value', () => {
    const result = parseFrontmatter('---\ndescription: |\n  line one\n  line two\n---\nbody');
    expect(result.meta).toEqual({ description: 'line one\nline two\n' });
    expect(result.body).toBe('body');
  });
});
