import templateHtml from './template.html?raw';
import type { Graph } from './graph.js';

export function buildHtml(graph: Graph): string {
  return templateHtml.replace('__GRAPH_DATA__', JSON.stringify(graph));
}
