# toolsview

[![CI](https://github.com/tupe12334/tools-view/actions/workflows/ci.yml/badge.svg)](https://github.com/tupe12334/tools-view/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/toolsview)](https://www.npmjs.com/package/toolsview)

Visualize your Claude Code skill graph. Run it in any repo that has `.claude/skills/` and get an interactive dependency map in your browser.

## What it does

Scans every `SKILL.md` in `.claude/skills/`, parses frontmatter and body text, infers relationships between skills, and opens an interactive force-directed graph (vis-network) in your browser.

Each edge is classified by how one skill references another:

| Type | Meaning |
|---|---|
| **prerequisite** | Must run before (e.g. login before scrape) |
| **calls** | Invokes as a sub-step |
| **suggests** | Recommends as a next step |
| **references** | Mentions for context |

Hover any node to see the skill's description and allowed tools. Output files land in `.claude/graph/` and are gitignored automatically.

## Usage

No install needed. Run from anywhere inside a repo that has `.claude/skills/`:

```bash
npx toolsview
# or
pnpm dlx toolsview
```

Requires Node ≥ 18. Walks up the directory tree until it finds `.claude/skills/`, builds the graph, writes `.claude/graph/graph.json` and `.claude/graph/graph.html`, then opens the HTML file in your default browser.

## Output

```
Skills: 7  Edges: 12
Written → .claude/graph/graph.json
Opening → .claude/graph/graph.html
```

Both output files are added to `.claude/graph/.gitignore` on first run.

## Skill format

Skills need a `SKILL.md` with YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does and when to trigger it.
allowed-tools: Bash, Read, Write
---

Skill body. Reference other skills by slash-name (e.g. /linkedin-login)
and the context around the mention determines the edge type.
```

Edge classification is based on the 120 characters before each `/skill-name` mention — words like `prerequisite`, `require`, `run before`, `calls`, `invokes`, `suggest`, `next step` steer the type.
