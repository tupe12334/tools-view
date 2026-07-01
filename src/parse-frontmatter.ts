import matter from 'gray-matter';
import type { ParsedFrontmatter } from './parsed-frontmatter.js';

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const { data, content: body } = matter(content);
  return { meta: data, body };
}
