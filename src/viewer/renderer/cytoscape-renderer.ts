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
  private bgClickHandler: (() => void) | null = null;
  private dragMoved = false;
  private basePositions = new Map<string, { x: number; y: number }>();
  private lastSpacingFactor = 1;
  private currentLayoutKind: 'force' | 'hierarchical' = 'force';

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
    });
    this.cy = cy;
    this.lastSpacingFactor = layout.spacingFactor;
    this.currentLayoutKind = layout.kind;
    this.runBaseLayout(layout, true);

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
        shiftKey: Boolean(orig?.shiftKey),
      });
    });
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) this.bgClickHandler?.();
    });
    cy.on('mouseover', 'node', (evt: EventObject) => {
      if (!this.hoverHandler) return;
      const node = (evt.target as NodeSingular).data('ref') as SkillNode;
      const orig = evt.originalEvent as MouseEvent | undefined;
      this.hoverHandler({
        node,
        clientX: orig?.clientX ?? 0,
        clientY: orig?.clientY ?? 0,
        shiftKey: Boolean(orig?.shiftKey),
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
    if (opts.kind !== this.currentLayoutKind) {
      this.currentLayoutKind = opts.kind;
      this.lastSpacingFactor = opts.spacingFactor;
      this.runBaseLayout(opts, true);
      return;
    }
    this.applySpacingScale(opts.spacingFactor);
    this.lastSpacingFactor = opts.spacingFactor;
  }

  private runBaseLayout(opts: LayoutOpts, fitAfter: boolean): void {
    if (!this.cy) return;
    const cy = this.cy;
    const baseOpts: LayoutOpts = { kind: opts.kind, spacingFactor: 1 };
    const lay = cy.layout(layoutConfig(baseOpts, true));
    lay.one('layoutstop', () => {
      this.basePositions.clear();
      cy.nodes().forEach((n) => {
        const p = n.position();
        this.basePositions.set(n.id(), { x: p.x, y: p.y });
      });
      this.applySpacingScale(opts.spacingFactor);
      if (fitAfter) cy.fit(undefined, 40);
    });
    lay.run();
  }

  private applySpacingScale(spacingFactor: number): void {
    if (!this.cy) return;
    const cy = this.cy;
    const sf = Math.max(0.1, spacingFactor);
    const viewCenterBefore = this.viewportCenter();
    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const base = this.basePositions.get(n.id());
        if (!base) return;
        n.position({ x: base.x * sf, y: base.y * sf });
      });
    });
    const newCenter = this.bboxCenter();
    if (!viewCenterBefore || !newCenter) return;
    const z = cy.zoom();
    cy.pan({
      x: cy.width() / 2 - newCenter.x * z,
      y: cy.height() / 2 - newCenter.y * z,
    });
  }

  private viewportCenter(): { x: number; y: number } | null {
    if (!this.cy) return null;
    const ext = this.cy.extent();
    return { x: (ext.x1 + ext.x2) / 2, y: (ext.y1 + ext.y2) / 2 };
  }

  private bboxCenter(): { x: number; y: number } | null {
    if (!this.cy) return null;
    const bb = this.cy.nodes().boundingBox();
    return { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 };
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

  onBackgroundClick(handler: () => void): void {
    this.bgClickHandler = handler;
  }

  isolate(nodeId: string): void {
    if (!this.cy) return;
    const cy = this.cy;
    const target = cy.getElementById(nodeId);
    if (target.empty()) return;
    const keep = target.closedNeighborhood();
    cy.batch(() => {
      cy.elements().difference(keep).addClass('faded');
      keep.removeClass('faded');
    });
  }

  clearIsolate(): void {
    this.cy?.elements().removeClass('faded');
  }

  fit(): void {
    this.cy?.fit(undefined, 40);
  }

  destroy(): void {
    this.cy?.destroy();
    this.cy = null;
  }
}
