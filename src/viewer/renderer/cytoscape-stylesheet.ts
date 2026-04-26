import type { EdgeType } from '../../edge-type.js';
import type { NodeType } from '../../node-type.js';
import type { RendererTheme } from './renderer-theme.js';
import type { StyleRule } from './style-rule.js';

const NODE_TYPES: NodeType[] = ['skill', 'agent'];
const EDGE_TYPES: EdgeType[] = ['prerequisite', 'calls', 'suggests', 'references'];

function baseRules(): StyleRule[] {
  return [
    {
      selector: 'node',
      style: {
        label: 'data(name)',
        color: '#e2e8f0',
        'font-family': 'system-ui, sans-serif',
        'font-size': 12,
        'font-weight': 700,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'none',
        shape: 'round-rectangle',
        width: 'label',
        height: 30,
        padding: 12,
        'border-width': 1.5,
      },
    },
    {
      selector: 'node:active, node:selected, node.active',
      style: { 'border-width': 2 },
    },
    {
      selector: 'edge',
      style: {
        label: 'data(type)',
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        width: 1.5,
        'font-size': 10,
        'font-family': 'system-ui, sans-serif',
        'text-rotation': 'autorotate',
        'text-margin-y': -7,
        'text-opacity': 0.75,
      },
    },
  ];
}

function nodeTypeRules(theme: RendererTheme): StyleRule[] {
  const out: StyleRule[] = [];
  for (const t of NODE_TYPES) {
    out.push({
      selector: `node[type="${t}"]`,
      style: {
        'background-color': theme.nodeFill[t],
        'border-color': theme.nodeBorder[t],
      },
    });
    out.push({
      selector: `node[type="${t}"].active`,
      style: {
        'background-color': theme.nodeFillActive[t],
        'border-color': theme.nodeBorderActive[t],
      },
    });
  }
  return out;
}

function edgeTypeRules(theme: RendererTheme): StyleRule[] {
  return EDGE_TYPES.map((t) => ({
    selector: `edge[type="${t}"]`,
    style: {
      'line-color': theme.edgeColor[t],
      'target-arrow-color': theme.edgeColor[t],
      color: theme.edgeColor[t],
      'line-style': theme.edgeDashed[t] ? 'dashed' : 'solid',
      width: theme.edgeDashed[t] ? 1 : 1.5,
    },
  }));
}

export function cytoscapeStylesheet(theme: RendererTheme): StyleRule[] {
  return [...baseRules(), ...nodeTypeRules(theme), ...edgeTypeRules(theme)];
}
