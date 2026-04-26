import type { ParsedFrontmatter } from './parsed-frontmatter.js';

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(content);
  if (!match) return { meta: {}, body: content };

  const meta: Partial<Record<string, string>> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }

  return { meta, body: content.slice(match[0].length) };
}
