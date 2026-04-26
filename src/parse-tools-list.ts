export function parseToolsList(value: string): string[] {
  const trimmed = value.trim();
  const inner =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  return inner
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}
