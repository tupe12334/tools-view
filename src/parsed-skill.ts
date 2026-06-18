export interface ParsedSkill {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  filePath: string;
  body: string;
}
