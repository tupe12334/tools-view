import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import type { Core, EventObject, LayoutOptions, NodeSingular } from 'cytoscape';
import type { Graph } from '../../graph.js';
import type { SkillNode } from '../../skill-node.js';
import type { GraphRenderer } from './graph-renderer.js';
import type { LayoutOpts } from './layout-opts.js';
import type { NodeEvent } from './node-event.js';
import type { RendererTheme } from './renderer-theme.js';
import { cytoscapeStylesheet } from './cytoscape-stylesheet.js';
import { dagreOptions } from './dagre-options.js';
import { fcoseOptions } from './fcose-options.js';

let registered = false;
function ensureRegistered(): void {
  if (registered) return;
  cytoscape.use(fcose);
  cytoscape.use(dagre);
  registered = true;
}

function layoutConfig(opts: LayoutOpts, randomize: boolean): LayoutOptions {
  if (opts.kind === 'hierarchical') {
    return dagreOptions(opts.spacingFactor);
  }
  return fcoseOptions(opts.spacingFactor, randomize);
}

export class CytoscapeRenderer implements GraphRenderer {
  private cy: Core | null = null;
  private clickHandler: ((e: NodeEvent) => void) | null = null;
  private hoverHandler: ((e: NodeEvent) => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private dragMoved = false;

  mount(container: HTMLElement, graph: Graph, theme: RendererTheme, layout: LayoutOpts): void {
    ensureRegistered();
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    if (measureCtx) measureCtx.font = 'bold 12px system-ui, sans-serif';
    const widthOf = (label: string): number => {
      const textW = measureCtx ? measureCtx.measureText(label).width : label.length * 7;
      return Math.ceil(textW + 24);
    };
    const elements = [
      ...graph.nodes.map((n) => ({
        group: 'nodes' as const,
        data: { id: n.id, name: n.name, type: n.type, w: widthOf(n.name), ref: n },
      })),
      ...graph.edges.map((e, i) => ({
        group: 'edges' as const,
        data: {
          id: 'e' + String(i),
          source: e.from,
          target: e.to,
          type: e.type,
        },
      })),
    ];
    const cy = cytoscape({
      container,
      elements,
      style: cytoscapeStylesheet(theme) as cytoscape.StylesheetJson,
      wheelSensitivity: 0.2,
      layout: layoutConfig(layout, true),
    });
    this.cy = cy;

    cy.on('tapstart', 'node', () => {
      this.dragMoved = false;
    });
    cy.on('drag', 'node', () => {
      this.dragMoved = true;
    });
    cy.on('tap', 'node', (evt: EventObject) => {
      if (this.dragMoved || !this.clickHandler) return;
      const node = (evt.target as NodeSingular).data('ref') as SkillNode;
      const orig = evt.originalEvent as MouseEvent | undefined;
      this.clickHandler({
        node,
        clientX: orig?.clientX ?? 0,
        clientY: orig?.clientY ?? 0,
      });
    });
    cy.on('mouseover', 'node', (evt: EventObject) => {
      if (!this.hoverHandler) return;
      const node = (evt.target as NodeSingular).data('ref') as SkillNode;
      const orig = evt.originalEvent as MouseEvent | undefined;
      this.hoverHandler({
        node,
        clientX: orig?.clientX ?? 0,
        clientY: orig?.clientY ?? 0,
      });
    });
    cy.on('mouseout', 'node', () => {
      this.blurHandler?.();
    });
    cy.on('pan zoom', () => {
      this.blurHandler?.();
    });
  }

  setLayout(opts: LayoutOpts): void {
    if (!this.cy) return;
    this.cy.layout(layoutConfig(opts, false)).run();
  }

  onNodeClick(handler: (e: NodeEvent) => void): void {
    this.clickHandler = handler;
  }

  onNodeHover(handler: (e: NodeEvent) => void): void {
    this.hoverHandler = handler;
  }

  onNodeBlur(handler: () => void): void {
    this.blurHandler = handler;
  }

  fit(): void {
    this.cy?.fit(undefined, 40);
  }

  destroy(): void {
    this.cy?.destroy();
    this.cy = null;
  }
}
