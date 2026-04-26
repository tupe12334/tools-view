import type { EdgeType } from '../../edge-type.js';
import type { NodeType } from '../../node-type.js';

export interface RendererTheme {
  nodeFill: Record<NodeType, string>;
  nodeBorder: Record<NodeType, string>;
  nodeFillActive: Record<NodeType, string>;
  nodeBorderActive: Record<NodeType, string>;
  edgeColor: Record<EdgeType, string>;
  edgeDashed: Record<EdgeType, boolean>;
}
