import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';
import type { Graph } from './graph.js';
import type { SkillNode } from './skill-node.js';
import { buildHtml } from './build-html.js';
import { extractEdges } from './extract-edges.js';
import { findAgentsDir } from './find-agents-dir.js';
import { findSkillIds } from './find-skill-ids.js';
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
    for (const { id, parentDir } of findSkillIds(skillsDir)) {
      const { body, ...node } = parseSkill(parentDir, id);
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
  const baseFor = (d: string): string =>
    ['skills', 'agents'].includes(path.basename(d)) ? path.dirname(d) : d;
  let claudeDir = skillsDir !== null ? baseFor(skillsDir) : '';
  if (agentsDir !== null && skillsDir === null) {
    claudeDir = baseFor(agentsDir);
  }
  const outDir = path.join(claudeDir, 'graph');
  fs.mkdirSync(outDir, { recursive: true });
  updateGitignore(path.join(outDir, '.gitignore'));
  const jsonPath = path.join(outDir, 'graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2) + '\n');
  const htmlPath = path.join(outDir, 'graph.html');
  fs.writeFileSync(htmlPath, buildHtml(graph));

  const skillCount = nodes.filter((n) => n.type === 'skill').length;
  const agentCount = nodes.filter((n) => n.type === 'agent').length;
  process.stderr.write(
    `Skills: ${String(skillCount)}  Agents: ${String(agentCount)}  Edges: ${String(edges.length)}\n`,
  );
  process.stderr.write(`Written → ${jsonPath}\n`);

  const url = pathToFileURL(htmlPath).href;
  process.stderr.write(`Opening → ${url}\n`);
  openBrowser(url);
}
