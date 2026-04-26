import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import templateHtml from './template.html?raw';

export type EdgeType = 'prerequisite' | 'calls' | 'suggests' | 'references';
export type NodeType = 'skill' | 'agent';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  type: NodeType;
}

export interface SkillEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface Graph {
  generated: string;
  skillsDir: string | null;
  agentsDir: string | null;
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export interface ParsedFrontmatter {
  meta: Record<string, string>;
  body: string;
}

export const TYPE_PRIORITY: Record<EdgeType, number> = {
  prerequisite: 3,
  calls: 2,
  suggests: 1,
  references: 0,
};

export function findSkillsDir(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, '.claude', 'skills');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function findAgentsDir(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, '.claude', 'agents');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function parseToolsList(value: string): string[] {
  const trimmed = value.trim();
  const inner =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  return inner
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { meta: {}, body: content };

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key) meta[key] = val;
  }

  return { meta, body: content.slice(match[0].length) };
}

export function classifyRef(contextBefore: string): EdgeType {
  const c = contextBefore.toLowerCase();

  if (
    c.includes('prerequisite') ||
    (c.includes('run') && c.includes('before')) ||
    c.includes('require') ||
    c.includes('must have') ||
    c.includes('ensure') ||
    c.includes('active session')
  )
    return 'prerequisite';

  if (
    c.includes('full logic in') ||
    c.includes('apply those instructions') ||
    c.includes('calls') ||
    c.includes('using') ||
    c.includes('invokes') ||
    (c.includes('step') && c.includes('run'))
  )
    return 'calls';

  if (
    c.includes('suggest') ||
    c.includes('next step') ||
    c.includes('next:') ||
    c.includes('then run') ||
    (c.includes('guide') && c.includes('run'))
  )
    return 'suggests';

  return 'references';
}

export function extractEdges(fromId: string, body: string, allSkillIds: string[]): SkillEdge[] {
  const best = new Map<string, { type: EdgeType; priority: number }>();

  for (const targetId of allSkillIds) {
    if (targetId === fromId) continue;

    const pattern = new RegExp(`/${targetId}(?=[^a-z0-9-]|$)`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(body)) !== null) {
      const before = body.slice(Math.max(0, m.index - 120), m.index);
      const type = classifyRef(before);
      const priority = TYPE_PRIORITY[type];
      const existing = best.get(targetId);
      if (!existing || priority > existing.priority) {
        best.set(targetId, { type, priority });
      }
    }
  }

  return [...best.entries()].map(([to, { type }]) => ({ from: fromId, to, type }));
}

export function buildHtml(graph: Graph): string {
  return templateHtml.replace('__GRAPH_DATA__', JSON.stringify(graph));
}

export function openBrowser(filePath: string): void {
  const cmds: Record<string, string> = {
    darwin: `open "${filePath}"`,
    win32: `start "" "${filePath}"`,
  };
  const cmd = cmds[process.platform] ?? `xdg-open "${filePath}"`;
  try {
    execSync(cmd);
  } catch {
    /* ignore */
  }
}

export function main(): void {
  const skillsDir = findSkillsDir(process.cwd());
  const agentsDir = findAgentsDir(process.cwd());

  if (!skillsDir && !agentsDir) {
    process.stderr.write(
      `Error: no .claude/skills/ or .claude/agents/ directory found (searched from ${process.cwd()})\n`,
    );
    process.exit(1);
  }

  const nodes: SkillNode[] = [];
  const bodyMap = new Map<string, string>();

  if (skillsDir) {
    const skillIds = fs
      .readdirSync(skillsDir)
      .filter(
        (e) =>
          fs.statSync(path.join(skillsDir, e)).isDirectory() &&
          fs.existsSync(path.join(skillsDir, e, 'SKILL.md')),
      );
    for (const id of skillIds) {
      const raw = fs.readFileSync(path.join(skillsDir, id, 'SKILL.md'), 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      nodes.push({
        id,
        name: meta['name'] ?? id,
        description: meta['description'] ?? '',
        allowedTools: meta['allowed-tools']
          ? meta['allowed-tools']
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        type: 'skill',
      });
      bodyMap.set(id, body);
    }
  }

  if (agentsDir) {
    const agentFiles = fs
      .readdirSync(agentsDir)
      .filter(
        (e) => e.endsWith('.md') && fs.statSync(path.join(agentsDir, e)).isFile(),
      );
    for (const file of agentFiles) {
      const id = file.replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(agentsDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      nodes.push({
        id,
        name: meta['name'] ?? id,
        description: meta['description'] ?? '',
        allowedTools: meta['tools'] ? parseToolsList(meta['tools']) : [],
        type: 'agent',
      });
      bodyMap.set(id, body);
    }
  }

  if (nodes.length === 0) {
    process.stderr.write(`Error: no skills or agents found\n`);
    process.exit(1);
  }

  const allIds = nodes.map((n) => n.id);
  const edges: SkillEdge[] = [];
  for (const [id, body] of bodyMap) {
    edges.push(...extractEdges(id, body, allIds));
  }

  const graph: Graph = {
    generated: new Date().toISOString(),
    skillsDir: skillsDir ? path.relative(process.cwd(), skillsDir) : null,
    agentsDir: agentsDir ? path.relative(process.cwd(), agentsDir) : null,
    nodes,
    edges,
  };

  const claudeDir = path.dirname(skillsDir ?? agentsDir!);
  const outDir = path.join(claudeDir, 'graph');
  fs.mkdirSync(outDir, { recursive: true });

  const gitignorePath = path.join(outDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'graph.json\ngraph.html\n');
  } else {
    const gi = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gi.includes('graph.html')) fs.appendFileSync(gitignorePath, 'graph.html\n');
  }

  const jsonPath = path.join(outDir, 'graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2) + '\n');

  const htmlPath = path.join(outDir, 'graph.html');
  fs.writeFileSync(htmlPath, buildHtml(graph));

  const skillCount = nodes.filter((n) => n.type === 'skill').length;
  const agentCount = nodes.filter((n) => n.type === 'agent').length;
  process.stderr.write(`Skills: ${skillCount}  Agents: ${agentCount}  Edges: ${edges.length}\n`);
  process.stderr.write(`Written → ${jsonPath}\n`);
  process.stderr.write(`Opening → ${htmlPath}\n`);

  openBrowser(htmlPath);
}
