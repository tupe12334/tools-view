import type { Graph } from '../../graph.js';
import type { LayoutOpts } from './layout-opts.js';
import type { NodeEvent } from './node-event.js';
import type { RendererTheme } from './renderer-theme.js';

export interface GraphRenderer {
  mount(container: HTMLElement, graph: Graph, theme: RendererTheme, layout: LayoutOpts): void;
  setLayout(opts: LayoutOpts): void;
  onNodeClick(handler: (e: NodeEvent) => void): void;
  onNodeHover(handler: (e: NodeEvent) => void): void;
  onNodeBlur(handler: () => void): void;
  fit(): void;
  destroy(): void;
}
