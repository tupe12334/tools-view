import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './parse-frontmatter.js';
import type { ParsedSkill } from './parsed-skill.js';

export function parseSkill(skillsDir: string, id: string): ParsedSkill {
  const raw = fs.readFileSync(path.join(skillsDir, id, 'SKILL.md'), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const allowedToolsRaw = meta['allowed-tools'];
  const allowedTools = Array.isArray(allowedToolsRaw)
    ? allowedToolsRaw.map((t) => String(t).trim()).filter((t) => t !== '')
    : typeof allowedToolsRaw === 'string'
      ? allowedToolsRaw
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== '')
      : [];
  return {
    id,
    name: typeof meta.name === 'string' ? meta.name : id,
    description: typeof meta.description === 'string' ? meta.description : '',
    allowedTools,
    filePath: path.join(skillsDir, id, 'SKILL.md'),
    body,
  };
}
