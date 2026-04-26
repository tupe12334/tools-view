export function autoSpacing(nodeCount: number, edgeCount: number): number {
  const byNodes = Math.sqrt(Math.max(1, nodeCount) / 10);
  const avgDeg = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
  const byDensity = Math.sqrt(Math.max(1, avgDeg) / 4);
  return Math.max(1, byNodes * byDensity);
}
