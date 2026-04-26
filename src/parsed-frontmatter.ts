export interface ParsedFrontmatter {
  meta: Partial<Record<string, string>>;
  body: string;
}
