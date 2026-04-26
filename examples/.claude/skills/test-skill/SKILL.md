---
name: Test Skill
description: A test skill with a mermaid diagram showing workflow
allowed-tools: Bash, Read
---

## Workflow

This skill demonstrates how to include mermaid diagrams in skill documentation. The diagram shows a typical decision flow.

```mermaid
graph TD
  A[Start] --> B[Process Data]
  B --> C{Decision}
  C -->|Yes| D[Success]
  C -->|No| E[Retry]
  E --> B
```

## Steps

1. First, initialize the system
2. Then process the data
3. Finally, validate results
