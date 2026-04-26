import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

type EdgeType = 'prerequisite' | 'calls' | 'suggests' | 'references';

interface SkillNode {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
}

interface SkillEdge {
  from: string;
  to: string;
  type: EdgeType;
}

interface Graph {
  generated: string;
  skillsDir: string;
  nodes: SkillNode[];
  edges: SkillEdge[];
}

interface ParsedFrontmatter {
  meta: Record<string, string>;
  body: string;
}

const TYPE_PRIORITY: Record<EdgeType, number> = {
  prerequisite: 3,
  calls: 2,
  suggests: 1,
  references: 0,
};

function findSkillsDir(startDir: string): string | null {
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

function parseFrontmatter(content: string): ParsedFrontmatter {
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

function classifyRef(contextBefore: string): EdgeType {
  const c = contextBefore.toLowerCase();

  if (
    c.includes('prerequisite') ||
    (c.includes('run') && c.includes('before')) ||
    c.includes('require') ||
    c.includes('must have') ||
    c.includes('ensure') ||
    c.includes('active session')
  ) return 'prerequisite';

  if (
    c.includes('full logic in') ||
    c.includes('apply those instructions') ||
    c.includes('calls') ||
    c.includes('using') ||
    c.includes('invokes') ||
    (c.includes('step') && c.includes('run'))
  ) return 'calls';

  if (
    c.includes('suggest') ||
    c.includes('next step') ||
    c.includes('next:') ||
    c.includes('then run') ||
    (c.includes('guide') && c.includes('run'))
  ) return 'suggests';

  return 'references';
}

function extractEdges(fromId: string, body: string, allSkillIds: string[]): SkillEdge[] {
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

function buildHtml(graph: Graph): string {
  const data = JSON.stringify(graph);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Skills Graph</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0f1117;color:#e2e8f0;font-family:system-ui,sans-serif;height:100vh;display:flex;flex-direction:column;overflow:hidden}
#bar{padding:10px 16px;background:#1a1d27;border-bottom:1px solid #2d3148;display:flex;align-items:center;gap:14px;flex-shrink:0}
#bar h1{font-size:13px;font-weight:600;color:#a5b4fc;letter-spacing:.05em}
#legend{display:flex;gap:14px;margin-left:auto}
.leg{display:flex;align-items:center;gap:5px;font-size:11px;color:#94a3b8}
.dot{width:9px;height:9px;border-radius:50%}
canvas{flex:1;display:block;cursor:grab}
canvas.grabbing{cursor:grabbing}
#tip{position:fixed;display:none;background:#1e2235;border:1px solid #3b4168;border-radius:7px;padding:9px 13px;font-size:12px;max-width:280px;pointer-events:none;z-index:9;line-height:1.5}
#tip b{color:#a5b4fc;display:block;margin-bottom:3px;font-size:13px}
#tip .t{color:#64748b;margin-top:5px;font-size:11px}
</style>
</head>
<body>
<div id="bar">
  <h1>Skills Graph</h1>
  <div id="legend">
    <div class="leg"><div class="dot" style="background:#f87171"></div>prerequisite</div>
    <div class="leg"><div class="dot" style="background:#60a5fa"></div>calls</div>
    <div class="leg"><div class="dot" style="background:#34d399"></div>suggests</div>
    <div class="leg"><div class="dot" style="background:#94a3b8"></div>references</div>
  </div>
</div>
<canvas id="c"></canvas>
<div id="tip"></div>
<script>
const G = ${data};

const COLORS = {
  prerequisite: '#f87171',
  calls:        '#60a5fa',
  suggests:     '#34d399',
  references:   '#475569',
};

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const tip = document.getElementById('tip');

let W, H;
let pan = {x:0, y:0}, scale = 1;
let drag = null, panDrag = null;

const nodes = G.nodes.map(n => ({ ...n, x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0 }));
const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
const edges = G.edges;

function resize() {
  W = canvas.width  = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

function initPositions() {
  nodes.forEach((n, i) => {
    const a = (2 * Math.PI * i) / nodes.length;
    const r = Math.min(W, H) * 0.32;
    n.x = W/2 + r * Math.cos(a);
    n.y = H/2 + r * Math.sin(a);
  });
}

function measureNodes() {
  ctx.font = 'bold 12px system-ui';
  nodes.forEach(n => {
    n.w = ctx.measureText(n.name).width + 24;
    n.h = 30;
  });
}

function tick() {
  const k = 200, repulsion = 8000, damping = 0.82, dt = 0.6;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i+1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
      const f = repulsion / (dist * dist);
      const fx = f * dx/dist, fy = f * dy/dist;
      a.vx -= fx; a.vy -= fy;
      b.vx += fx; b.vy += fy;
    }
  }

  edges.forEach(e => {
    const a = nodeById[e.from], b = nodeById[e.to];
    if (!a || !b) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.max(Math.sqrt(dx*dx + dy*dy), 1);
    const f = (dist - k) * 0.04;
    const fx = f * dx/dist, fy = f * dy/dist;
    a.vx += fx; a.vy += fy;
    b.vx -= fx; b.vy -= fy;
  });

  nodes.forEach(n => {
    n.vx += (W/2 - n.x) * 0.002;
    n.vy += (H/2 - n.y) * 0.002;
  });

  nodes.forEach(n => {
    if (n === drag) return;
    n.vx *= damping; n.vy *= damping;
    n.x += n.vx * dt; n.y += n.vy * dt;
  });
}

function screenToWorld(x, y) {
  return { x: (x - pan.x) / scale, y: (y - pan.y) / scale };
}

function drawArrow(x1, y1, x2, y2, color, dashed) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = dashed ? 1 : 1.5;
  if (dashed) ctx.setLineDash([4, 4]);

  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const ux = dx/len, uy = dy/len;
  const ax = x1 + ux * 10, ay = y1 + uy * 10;
  const bx = x2 - ux * 14, by = y2 - uy * 14;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  const hw = 6, hl = 10;
  const px = -uy, py = ux;
  ctx.beginPath();
  ctx.moveTo(bx + ux*hl, by + uy*hl);
  ctx.lineTo(bx + px*hw, by + py*hw);
  ctx.lineTo(bx - px*hw, by - py*hw);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(scale, scale);

  edges.forEach(e => {
    const a = nodeById[e.from], b = nodeById[e.to];
    if (!a || !b) return;
    const color = COLORS[e.type] || COLORS.references;
    drawArrow(a.x, a.y, b.x, b.y, color, e.type === 'references');
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = '10px system-ui';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.type, mx, my - 7);
    ctx.globalAlpha = 1;
  });

  nodes.forEach(n => {
    const hw = n.w/2, hh = n.h/2;
    ctx.beginPath();
    ctx.roundRect(n.x - hw, n.y - hh, n.w, n.h, 6);
    ctx.fillStyle = n === drag ? '#2d3458' : '#1e2235';
    ctx.fill();
    ctx.strokeStyle = n === drag ? '#a5b4fc' : '#4f5d8a';
    ctx.lineWidth = n === drag ? 2 : 1.5;
    ctx.stroke();
    ctx.font = 'bold 12px system-ui';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, n.x, n.y);
  });

  ctx.restore();
}

let ticks = 0;
function loop() {
  if (ticks < 300) { tick(); ticks++; }
  draw();
  requestAnimationFrame(loop);
}

function hitNode(wx, wy) {
  return nodes.find(n => Math.abs(wx - n.x) < n.w/2 && Math.abs(wy - n.y) < n.h/2);
}

canvas.addEventListener('mousedown', e => {
  const {x, y} = screenToWorld(e.offsetX, e.offsetY);
  const n = hitNode(x, y);
  if (n) { drag = n; canvas.classList.add('grabbing'); }
  else { panDrag = {sx: e.offsetX - pan.x, sy: e.offsetY - pan.y}; canvas.classList.add('grabbing'); }
});

canvas.addEventListener('mousemove', e => {
  if (drag) {
    const {x, y} = screenToWorld(e.offsetX, e.offsetY);
    drag.x = x; drag.y = y; drag.vx = 0; drag.vy = 0;
    ticks = 0; tip.style.display = 'none'; return;
  }
  if (panDrag) {
    pan.x = e.offsetX - panDrag.sx;
    pan.y = e.offsetY - panDrag.sy;
    return;
  }
  const {x, y} = screenToWorld(e.offsetX, e.offsetY);
  const n = hitNode(x, y);
  if (n) {
    const desc = n.description.length > 160 ? n.description.slice(0,157)+'\\u2026' : n.description;
    const tools = n.allowedTools.length ? '<div class="t">Tools: ' + n.allowedTools.join(', ') + '</div>' : '';
    tip.innerHTML = '<b>' + n.name + '</b><div>' + desc + '</div>' + tools;
    tip.style.display = 'block';
    const pad = 12, tw = tip.offsetWidth || 280;
    tip.style.left = (e.clientX + pad + tw > window.innerWidth ? e.clientX - tw - pad : e.clientX + pad) + 'px';
    tip.style.top  = (e.clientY + pad) + 'px';
  } else { tip.style.display = 'none'; }
});

window.addEventListener('mouseup', () => {
  drag = null; panDrag = null; canvas.classList.remove('grabbing');
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  pan.x = e.offsetX - (e.offsetX - pan.x) * factor;
  pan.y = e.offsetY - (e.offsetY - pan.y) * factor;
  scale *= factor;
}, {passive: false});

window.addEventListener('resize', resize);
resize();
measureNodes();
initPositions();
loop();
</script>
</body>
</html>`;
}

function openBrowser(filePath: string): void {
  const cmds: Record<string, string> = {
    darwin: `open "${filePath}"`,
    win32:  `start "" "${filePath}"`,
  };
  const cmd = cmds[process.platform] ?? `xdg-open "${filePath}"`;
  try { execSync(cmd); } catch { /* ignore */ }
}

function main(): void {
  const skillsDir = findSkillsDir(process.cwd());
  if (!skillsDir) {
    process.stderr.write(`Error: no .claude/skills/ directory found (searched from ${process.cwd()})\n`);
    process.exit(1);
  }

  const skillIds = fs.readdirSync(skillsDir).filter(e =>
    fs.statSync(path.join(skillsDir, e)).isDirectory() &&
    fs.existsSync(path.join(skillsDir, e, 'SKILL.md'))
  );

  if (skillIds.length === 0) {
    process.stderr.write(`Error: no skills found in ${skillsDir}\n`);
    process.exit(1);
  }

  const skills = skillIds.map(id => {
    const raw = fs.readFileSync(path.join(skillsDir, id, 'SKILL.md'), 'utf-8');
    const { meta, body } = parseFrontmatter(raw);
    return {
      id,
      name: meta['name'] ?? id,
      description: meta['description'] ?? '',
      allowedTools: meta['allowed-tools']
        ? meta['allowed-tools'].split(',').map(t => t.trim()).filter(Boolean)
        : [],
      body,
    };
  });

  const nodes: SkillNode[] = skills.map(({ id, name, description, allowedTools }) => ({
    id, name, description, allowedTools,
  }));

  const edges: SkillEdge[] = skills.flatMap(skill =>
    extractEdges(skill.id, skill.body, skillIds)
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

  process.stderr.write(`Skills: ${nodes.length}  Edges: ${edges.length}\n`);
  process.stderr.write(`Written → ${jsonPath}\n`);
  process.stderr.write(`Opening → ${htmlPath}\n`);

  openBrowser(htmlPath);
}

main();
