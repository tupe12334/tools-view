import templateHtml from './template.html?raw';
import type { Graph } from './graph.js';

export function buildHtml(graph: Graph): string {
  const safeJson = JSON.stringify(graph).replace(/<\//g, '<\\/');
  return templateHtml.replace('/*__GRAPH_DATA_PLACEHOLDER__*/null', () => safeJson);
}
