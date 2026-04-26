import type { Graph } from '../graph.js';
import type { SkillNode } from '../skill-node.js';
import { extractMermaidBlocks } from './extract-mermaid-blocks.js';
import { highlightSkillNodes } from './highlight-skill-nodes.js';
import { mermaidLiveUrl } from './mermaid-live-url.js';
import { autoSpacing } from './auto-spacing.js';
import { CytoscapeRenderer } from './renderer/cytoscape-renderer.js';
import type { GraphRenderer } from './renderer/graph-renderer.js';
import type { LayoutOpts } from './renderer/layout-opts.js';
import type { NodeEvent } from './renderer/node-event.js';
import type { RendererTheme } from './renderer/renderer-theme.js';

declare global {
  interface Window {
    __GRAPH_DATA__: Graph;
    __toolsview: {
      G: Graph;
      renderer: GraphRenderer;
      clickNode: (id: string) => void;
    };
  }
}

const G = window.__GRAPH_DATA__;
const skillIds = new Set(G.nodes.map((nd) => nd.id));
const nodeById = new Map<string, SkillNode>(G.nodes.map((nd) => [nd.id, nd]));

const theme: RendererTheme = {
  nodeFill: { skill: '#1e2235', agent: '#1a2820' },
  nodeBorder: { skill: '#4f5d8a', agent: '#4a7c55' },
  nodeFillActive: { skill: '#2d3458', agent: '#1f3d2a' },
  nodeBorderActive: { skill: '#a5b4fc', agent: '#86efac' },
  edgeColor: {
    prerequisite: '#f87171',
    calls: '#60a5fa',
    suggests: '#34d399',
    references: '#475569',
  },
  edgeDashed: {
    prerequisite: false,
    calls: false,
    suggests: false,
    references: true,
  },
};

function openMermaidLive(node: SkillNode): void {
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

const container = document.getElementById('c') as HTMLElement;
const tip = document.getElementById('tip') as HTMLElement;

let spacingFactor = autoSpacing(G.nodes.length, G.edges.length);
const spacingEl = document.getElementById('spacing') as HTMLInputElement;
const sliderMax = Math.max(10, Math.ceil(spacingFactor * 5) * 2);
spacingEl.max = String(sliderMax);
spacingEl.value = String(Math.round(spacingFactor * 5));

const renderer: GraphRenderer = new CytoscapeRenderer();
renderer.mount(container, G, theme, { kind: 'force', spacingFactor });

let spacingTimer: number | undefined;
spacingEl.addEventListener('input', (e) => {
  spacingFactor = Number((e.target as HTMLInputElement).value) / 5;
  if (spacingTimer !== undefined) window.clearTimeout(spacingTimer);
  spacingTimer = window.setTimeout(() => {
    const opts: LayoutOpts = { kind: 'force', spacingFactor };
    renderer.setLayout(opts);
  }, 150);
});

renderer.onNodeClick(({ node }: NodeEvent) => {
  openMermaidLive(node);
});

function showTip(node: SkillNode, clientX: number, clientY: number): void {
  const desc = node.description.length > 160 ? node.description.slice(0, 157) + '…' : node.description;
  const tools = node.allowedTools.length
    ? '<div class="t">Tools: ' + node.allowedTools.join(', ') + '</div>'
    : '';
  const typeLabel = '<div class="t">' + node.type + '</div>';
  tip.innerHTML = '<b>' + node.name + '</b>' + typeLabel + '<div>' + desc + '</div>' + tools;
  tip.style.display = 'block';
  const pad = 12;
  const tw = tip.offsetWidth || 280;
  tip.style.left =
    (clientX + pad + tw > window.innerWidth ? clientX - tw - pad : clientX + pad) + 'px';
  tip.style.top = clientY + pad + 'px';
}

renderer.onNodeHover(({ node, clientX, clientY }: NodeEvent) => {
  showTip(node, clientX, clientY);
});

renderer.onNodeBlur(() => {
  tip.style.display = 'none';
});

window.addEventListener('resize', () => {
  renderer.fit();
});

window.__toolsview = {
  G,
  renderer,
  clickNode: (id: string) => {
    const node = nodeById.get(id);
    if (node) openMermaidLive(node);
  },
};
