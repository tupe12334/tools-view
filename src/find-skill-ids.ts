import fs from 'fs';
import path from 'path';

export interface SkillEntry {
  id: string;
  parentDir: string;
}

export function findSkillIds(skillsDir: string): SkillEntry[] {
  const out: SkillEntry[] = [];
  const seen = new Set<string>();
  const walk = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const sub = path.join(dir, e.name);
      const skillFile = path.join(sub, 'SKILL.md');
      if (fs.existsSync(skillFile) && fs.statSync(skillFile).isFile()) {
        if (seen.has(e.name)) continue;
        seen.add(e.name);
        out.push({ id: e.name, parentDir: dir });
        continue;
      }
      walk(sub);
    }
  };
  walk(skillsDir);
  return out;
}
