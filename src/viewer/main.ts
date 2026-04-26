import type { Graph } from '../graph.js';
import type { NodeType } from '../node-type.js';
import type { EdgeType } from '../edge-type.js';
import type { SimNode } from './sim-node.js';
import { extractMermaidBlocks } from './extract-mermaid-blocks.js';
import { highlightSkillNodes } from './highlight-skill-nodes.js';
import { mermaidLiveUrl } from './mermaid-live-url.js';
import { initPositions } from './init-positions.js';
import { tick } from './tick.js';
import { screenToWorld } from './screen-to-world.js';
import { hitNode } from './hit-node.js';
import { autoSpacing } from './auto-spacing.js';

declare global {
  interface Window {
    __GRAPH_DATA__: Graph;
    __toolsview: { G: Graph; nodes?: SimNode[] };
  }
}

const G = window.__GRAPH_DATA__;
window.__toolsview = { G };

const skillIds = new Set(G.nodes.map((nd) => nd.id));

function openMermaidLive(node: SimNode): void {
  if (!node.body) {
    alert('No diagram found for this ' + node.type);
    return;
  }
  const blocks = extractMermaidBlocks(node.body);
  if (blocks.length === 0) {
    alert('No mermaid diagrams found in ' + node.name);
    return;
  }
  blocks.forEach((block) => {
    window.open(mermaidLiveUrl(highlightSkillNodes(block, skillIds)), '_blank', 'noopener');
  });
}

const hasSkills = G.nodes.some((nd) => nd.type === 'skill');
const hasAgents = G.nodes.some((nd) => nd.type === 'agent');
const titleEl = document.getElementById('title') as HTMLElement;
titleEl.textContent =
  hasSkills && hasAgents ? 'Skills & Agents Graph' : hasAgents ? 'Agents Graph' : 'Skills Graph';
document.title = titleEl.textContent;
if (!hasSkills) (document.getElementById('leg-skill') as HTMLElement).style.display = 'none';
if (!hasAgents) (document.getElementById('leg-agent') as HTMLElement).style.display = 'none';
if (!hasSkills || !hasAgents)
  (document.getElementById('type-legend') as HTMLElement).style.borderRight = 'none';

const NODE_FILL: Record<NodeType, string> = { skill: '#1e2235', agent: '#1a2820' };
const NODE_BORDER: Record<NodeType, string> = { skill: '#4f5d8a', agent: '#4a7c55' };
const NODE_FILL_DRAG: Record<NodeType, string> = { skill: '#2d3458', agent: '#1f3d2a' };
const NODE_BORDER_DRAG: Record<NodeType, string> = { skill: '#a5b4fc', agent: '#86efac' };

const COLORS: Record<EdgeType, string> = {
  prerequisite: '#f87171',
  calls: '#60a5fa',
  suggests: '#34d399',
  references: '#475569',
};

const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const tip = document.getElementById('tip') as HTMLElement;

let W = 0;
let H = 0;
const pan = { x: 0, y: 0 };
let scale = 1;
let drag: SimNode | null = null;
let panDrag: { sx: number; sy: number } | null = null;
let spacingFactor = autoSpacing(G.nodes.length, G.edges.length);
let clickNode: SimNode | null = null;
let clickPos: { x: number; y: number } | null = null;
let ticks = 0;

const spacingEl = document.getElementById('spacing') as HTMLInputElement;
const sliderMax = Math.max(10, Math.ceil(spacingFactor * 5) * 2);
spacingEl.max = String(sliderMax);
spacingEl.value = String(Math.round(spacingFactor * 5));
spacingEl.addEventListener('input', (e) => {
  spacingFactor = Number((e.target as HTMLInputElement).value) / 5;
  ticks = 0;
});

const nodes: SimNode[] = G.nodes.map((nd) => ({
  ...nd,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  w: 0,
  h: 0,
}));
const nodeById = new Map<string, SimNode>(nodes.map((nd) => [nd.id, nd]));
const edges = G.edges;
window.__toolsview.nodes = nodes;

function resize(): void {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

function measureNodes(): void {
  ctx.font = 'bold 12px system-ui';
  nodes.forEach((nd) => {
    nd.w = ctx.measureText(nd.name).width + 24;
    nd.h = 30;
  });
}

function drawArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed: boolean,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = dashed ? 1 : 1.5;
  if (dashed) ctx.setLineDash([4, 4]);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ax = x1 + ux * 10;
  const ay = y1 + uy * 10;
  const bx = x2 - ux * 14;
  const by = y2 - uy * 14;

  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
  ctx.setLineDash([]);

  const hw = 6;
  const hl = 10;
  const px = -uy;
  const py = ux;
  ctx.beginPath();
  ctx.moveTo(bx + ux * hl, by + uy * hl);
  ctx.lineTo(bx + px * hw, by + py * hw);
  ctx.lineTo(bx - px * hw, by - py * hw);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw(): void {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(scale, scale);

  edges.forEach((e) => {
    const a = nodeById.get(e.from);
    const b = nodeById.get(e.to);
    if (!a || !b) return;
    const color = COLORS[e.type] || COLORS.references;
    drawArrow(a.x, a.y, b.x, b.y, color, e.type === 'references');
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    ctx.font = '10px system-ui';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.75;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.type, mx, my - 7);
    ctx.globalAlpha = 1;
  });

  nodes.forEach((nd) => {
    const hw = nd.w / 2;
    const hh = nd.h / 2;
    ctx.beginPath();
    ctx.roundRect(nd.x - hw, nd.y - hh, nd.w, nd.h, 6);
    ctx.fillStyle = nd === drag ? NODE_FILL_DRAG[nd.type] : NODE_FILL[nd.type];
    ctx.fill();
    ctx.strokeStyle = nd === drag ? NODE_BORDER_DRAG[nd.type] : NODE_BORDER[nd.type];
    ctx.lineWidth = nd === drag ? 2 : 1.5;
    ctx.stroke();
    ctx.font = 'bold 12px system-ui';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nd.name, nd.x, nd.y);
  });

  ctx.restore();
}

const tickBudget = 300 + G.nodes.length * 10;
function loop(): void {
  if (ticks < tickBudget) {
    tick({ nodes, nodeById, edges, drag, spacingFactor, W, H });
    ticks++;
  }
  draw();
  requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = screenToWorld(e.offsetX, e.offsetY, pan, scale);
  const n = hitNode(x, y, nodes);
  if (n) {
    drag = n;
    clickNode = n;
    clickPos = { x: e.clientX, y: e.clientY };
    canvas.classList.add('grabbing');
  } else {
    panDrag = { sx: e.offsetX - pan.x, sy: e.offsetY - pan.y };
    canvas.classList.add('grabbing');
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (drag) {
    const { x, y } = screenToWorld(e.offsetX, e.offsetY, pan, scale);
    drag.x = x;
    drag.y = y;
    drag.vx = 0;
    drag.vy = 0;
    ticks = 0;
    tip.style.display = 'none';
    return;
  }
  if (panDrag) {
    pan.x = e.offsetX - panDrag.sx;
    pan.y = e.offsetY - panDrag.sy;
    return;
  }
  const { x, y } = screenToWorld(e.offsetX, e.offsetY, pan, scale);
  const n = hitNode(x, y, nodes);
  if (n) {
    const desc = n.description.length > 160 ? n.description.slice(0, 157) + '…' : n.description;
    const tools = n.allowedTools.length
      ? '<div class="t">Tools: ' + n.allowedTools.join(', ') + '</div>'
      : '';
    const typeLabel = '<div class="t">' + n.type + '</div>';
    tip.innerHTML = '<b>' + n.name + '</b>' + typeLabel + '<div>' + desc + '</div>' + tools;
    tip.style.display = 'block';
    const pad = 12;
    const tw = tip.offsetWidth || 280;
    tip.style.left =
      (e.clientX + pad + tw > window.innerWidth ? e.clientX - tw - pad : e.clientX + pad) + 'px';
    tip.style.top = e.clientY + pad + 'px';
  } else {
    tip.style.display = 'none';
  }
});

window.addEventListener('mouseup', (e) => {
  if (clickNode && clickPos) {
    const dx = e.clientX - clickPos.x;
    const dy = e.clientY - clickPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) openMermaidLive(clickNode);
  }
  drag = null;
  panDrag = null;
  clickNode = null;
  clickPos = null;
  canvas.classList.remove('grabbing');
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    pan.x = e.offsetX - (e.offsetX - pan.x) * factor;
    pan.y = e.offsetY - (e.offsetY - pan.y) * factor;
    scale *= factor;
  },
  { passive: false },
);

window.addEventListener('resize', resize);
resize();
measureNodes();
initPositions(nodes, W, H);
loop();
