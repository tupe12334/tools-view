# Toolsview Examples

Example skills demonstrating toolsview features.

## Skills Included

### test-skill

Basic skill with a mermaid diagram showing a workflow with decision branching.

Features:
- Mermaid diagram with TD (top-down) flow
- Decision nodes and conditional paths
- Retry loop pattern

### another-skill

Skill that demonstrates referencing other skills within mermaid diagrams.

Features:
- References `test-skill` by its ID in a mermaid node
- Shows how skill relationships are visualized
- Referenced skills are automatically highlighted in green when viewing the diagram

## Usage

To view the graph:

```bash
cd examples
npx toolsview
```

This will open an interactive graph showing:
- Nodes for each skill with their type (skill/agent)
- Edges showing relationships (calls, prerequisites, etc.)
- Click any node to view its mermaid diagrams
- Nodes in diagrams that match other skills are highlighted in green
