export function highlightSkillNodes(mermaidCode: string, skillIds: Set<string>): string {
  const nodeIdRegex = /([a-zA-Z0-9_-]+)\[(.*?)\]/g;
  const matchedIds = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = nodeIdRegex.exec(mermaidCode)) !== null) {
    if (skillIds.has(match[1])) matchedIds.add(match[1]);
  }
  if (matchedIds.size === 0) return mermaidCode;
  const styleBlock =
    '\n  style ' +
    Array.from(matchedIds)
      .map((id) => `${id} fill:#2d5a3d,stroke:#86efac,color:#e2e8f0,stroke-width:2px`)
      .join('; ');
  return mermaidCode + styleBlock;
}
