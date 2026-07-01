import fs from 'fs';
import path from 'path';
import { parseFrontmatter } from './parse-frontmatter.js';
import { parseToolsList } from './parse-tools-list.js';
import type { ParsedAgent } from './parsed-agent.js';

export function parseAgent(agentsDir: string, file: string): ParsedAgent {
  const id = file.replace(/\.md$/, '');
  const raw = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);
  const toolsRaw = meta.tools;
  const allowedTools = Array.isArray(toolsRaw)
    ? toolsRaw.map((t) => String(t).trim()).filter((t) => t !== '')
    : typeof toolsRaw === 'string'
      ? parseToolsList(toolsRaw)
      : [];
  return {
    id,
    name: typeof meta.name === 'string' ? meta.name : id,
    description: typeof meta.description === 'string' ? meta.description : '',
    allowedTools,
    filePath: path.join(agentsDir, file),
    body,
  };
}
