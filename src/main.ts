import fs from 'fs';
import path from 'path';
import type { Graph } from './graph.js';
import type { SkillEdge } from './skill-edge.js';
import type { SkillNode } from './skill-node.js';
import { buildHtml } from './build-html.js';
import { extractEdges } from './extract-edges.js';
import { findSkillsDir } from './find-skills-dir.js';
import { openBrowser } from './open-browser.js';
import { parseFrontmatter } from './parse-frontmatter.js';

function parseSkill(skillsDir: string, id: string) {
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
    body,
  };
}

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
  if (!skillsDir) {
    process.stderr.write(
      `Error: no .claude/skills/ directory found (searched from ${process.cwd()})\n`,
    );
    process.exit(1);
  }

  const skillIds = fs
    .readdirSync(skillsDir)
    .filter(
      (e) =>
        fs.statSync(path.join(skillsDir, e)).isDirectory() &&
        fs.existsSync(path.join(skillsDir, e, 'SKILL.md')),
    );

  if (skillIds.length === 0) {
    process.stderr.write(`Error: no skills found in ${skillsDir}\n`);
    process.exit(1);
  }

  const skills = skillIds.map((id) => parseSkill(skillsDir, id));
  const nodes: SkillNode[] = skills.map(({ id, name, description, allowedTools }) => ({
    id,
    name,
    description,
    allowedTools,
  }));
  const edges: SkillEdge[] = skills.flatMap((skill) =>
    extractEdges(skill.id, skill.body, skillIds),
  );
  const graph: Graph = {
    generated: new Date().toISOString(),
    skillsDir: path.relative(process.cwd(), skillsDir),
    nodes,
    edges,
  };

  const claudeDir = path.dirname(skillsDir);
  const outDir = path.join(claudeDir, 'graph');
  fs.mkdirSync(outDir, { recursive: true });
  updateGitignore(path.join(outDir, '.gitignore'));

  const jsonPath = path.join(outDir, 'graph.json');
  fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2) + '\n');
  const htmlPath = path.join(outDir, 'graph.html');
  fs.writeFileSync(htmlPath, buildHtml(graph));

  process.stderr.write(`Skills: ${String(nodes.length)}  Edges: ${String(edges.length)}\n`);
  process.stderr.write(`Written → ${jsonPath}\n`);
  process.stderr.write(`Opening → ${htmlPath}\n`);
  openBrowser(htmlPath);
}
