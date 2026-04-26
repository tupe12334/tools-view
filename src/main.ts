import fs from 'fs';
import path from 'path';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'url';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

export function createRequestHandler(outDir: string) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    const reqUrl = !req.url || req.url === '/' ? '/graph.html' : req.url;
    const safe = path.normalize(reqUrl).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(outDir, safe);
    try {
      const content = fs.readFileSync(filePath);
      const type = MIME[path.extname(filePath)] ?? 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  };
}
import type { Graph } from './graph.js';
import type { SkillNode } from './skill-node.js';
import { buildHtml } from './build-html.js';
import { extractEdges } from './extract-edges.js';
import { findAgentsDir } from './find-agents-dir.js';
import { findSkillsDir } from './find-skills-dir.js';
import { openBrowser } from './open-browser.js';
import { parseAgent } from './parse-agent.js';
import { parseSkill } from './parse-skill.js';

function updateGitignore(gitignorePath: string): void {
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'graph.json\ngraph.html\n');
    return;
  }
  const gi = fs.readFileSync(gitignorePath, 'utf-8');
  if (!gi.includes('graph.html')) fs.appendFileSync(gitignorePath, 'graph.html\n');
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
  if (skillsDir !== null) {
    const skillIds = fs
      .readdirSync(skillsDir)
      .filter(
        (e) =>
          fs.statSync(path.join(skillsDir, e)).isDirectory() &&
          fs.existsSync(path.join(skillsDir, e, 'SKILL.md')),
      );
    for (const id of skillIds) {
      const { body, ...node } = parseSkill(skillsDir, id);
      nodes.push({ ...node, type: 'skill', body });
      bodyMap.set(id, body);
    }
  }
  if (agentsDir !== null) {
    const agentFiles = fs
      .readdirSync(agentsDir)
      .filter((e) => e.endsWith('.md') && fs.statSync(path.join(agentsDir, e)).isFile());
    for (const file of agentFiles) {
      const { body, ...node } = parseAgent(agentsDir, file);
      nodes.push({ ...node, type: 'agent', body });
      bodyMap.set(node.id, body);
    }
  }
  if (nodes.length === 0) {
    process.stderr.write(`Error: no skills or agents found\n`);
    process.exit(1);
  }
  const allIds = nodes.map((n) => n.id);
  const edges = [...bodyMap.entries()].flatMap(([id, body]) => extractEdges(id, body, allIds));
  const graph: Graph = {
    generated: new Date().toISOString(),
    skillsDir: skillsDir !== null ? path.relative(process.cwd(), skillsDir) : null,
    agentsDir: agentsDir !== null ? path.relative(process.cwd(), agentsDir) : null,
    nodes,
    edges,
  };
  let claudeDir = skillsDir !== null ? path.dirname(skillsDir) : '';
  if (agentsDir !== null && skillsDir === null) {
    claudeDir = path.dirname(agentsDir);
  }
  const outDir = path.join(claudeDir, 'graph');
  fs.mkdirSync(outDir, { recursive: true });
  updateGitignore(path.join(outDir, '.gitignore'));
  const jsonPath = path.join(outDir, 'graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2) + '\n');
  const htmlPath = path.join(outDir, 'graph.html');
  fs.writeFileSync(htmlPath, buildHtml(graph));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const mermaidSrc = path.join(__dirname, '..', 'node_modules', 'mermaid', 'dist', 'mermaid.min.js');
  const mermaidDest = path.join(outDir, 'mermaid.min.js');
  if (fs.existsSync(mermaidSrc)) {
    fs.copyFileSync(mermaidSrc, mermaidDest);
  }

  const skillCount = nodes.filter((n) => n.type === 'skill').length;
  const agentCount = nodes.filter((n) => n.type === 'agent').length;
  process.stderr.write(
    `Skills: ${String(skillCount)}  Agents: ${String(agentCount)}  Edges: ${String(edges.length)}\n`,
  );
  process.stderr.write(`Written → ${jsonPath}\n`);

  const PORT = 8765;
  const server = http.createServer(createRequestHandler(outDir));
  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}/graph.html`;
    process.stderr.write(`Opening → ${url}\n`);
    openBrowser(url);
  });
}
