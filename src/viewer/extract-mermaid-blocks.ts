export function extractMermaidBlocks(body: string): string[] {
  const blocks: string[] = [];
  const regex = /```mermaid\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}
