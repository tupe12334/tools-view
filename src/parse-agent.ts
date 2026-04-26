import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './parse-frontmatter.js';
import { parseToolsList } from './parse-tools-list.js';

export function parseAgent(agentsDir: string, file: string) {
  const id = file.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const toolsRaw = meta.tools;
  const allowedTools = toolsRaw !== undefined ? parseToolsList(toolsRaw) : [];
  return {
    id,
    name: meta.name !== undefined ? meta.name : id,
    description: meta.description !== undefined ? meta.description : '',
    allowedTools,
    filePath: path.join(agentsDir, file),
    body,
  };
}
