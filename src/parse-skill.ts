import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './parse-frontmatter.js';

export function parseSkill(skillsDir: string, id: string) {
  const raw = fs.readFileSync(path.join(skillsDir, id, 'SKILL.md'), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const allowedToolsRaw = meta['allowed-tools'];
  const allowedTools =
    allowedToolsRaw !== undefined
      ? allowedToolsRaw
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== '')
      : [];
  return {
    id,
    name: meta.name !== undefined ? meta.name : id,
    description: meta.description !== undefined ? meta.description : '',
    allowedTools,
    filePath: path.join(skillsDir, id, 'SKILL.md'),
    body,
  };
}
