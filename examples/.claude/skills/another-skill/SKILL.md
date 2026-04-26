---
name: Another Skill
description: Demonstrates skill references in mermaid diagrams
allowed-tools: Bash
---

## Process

This skill calls /test-skill to do the actual work. Notice how the mermaid diagram below references test-skill by its ID - toolsview will highlight it with a green color to show it's a known skill in the graph.

```mermaid
graph LR
  A[Input] --> test-skill["Execute test-skill"]
  test-skill --> C[Output]
  C --> D[Complete]
```

## Features

- Demonstrates skill-to-skill references
- Mermaid nodes matching skill IDs are automatically highlighted
- Great for visualizing skill dependencies and workflows
