# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2026-04-26

### Added
- Support flat-layout skill repos (e.g. gstack) where each skill is a top-level directory containing `SKILL.md`; detected when a directory has 2+ immediate `<dir>/SKILL.md` siblings

### Fixed
- Graph output directory for non-`skills`/`agents` roots now writes inside the root (e.g. `<repo>/graph/`) instead of escaping to its parent

## [1.4.1] - 2026-04-26

### Changed
- Extract inline viewer JS from `template.html` into typed `src/viewer/` modules; Vite bundles `viewer/main.ts` via esbuild and inlines the IIFE at build time

## [1.4.0] - 2026-04-26

### Changed
- Node click now opens the diagram in a new `mermaid.live` tab (URL-safe base64 state) instead of an in-page modal

### Removed
- In-page mermaid modal, mermaid CDN script, and unused `mermaid` runtime dependency

## [1.3.0] - 2026-04-26

### Added
- Detect skill calls inside `Agent()` prompt args
- Support top-level `skills/` directory with nested category subdirectories
- Display mermaid diagrams from skill bodies on node click
- Highlight skill references inside mermaid diagrams
- Serve graph over localhost with proper MIME types and e2e tests
- `test:e2e:headed` script
- Playwright MCP with isolation

### Changed
- Open graph as `file://` URL instead of localhost server
- Load mermaid from CDN instead of bundling
- Pre-commit hook now runs lint

### Fixed
- Click detection for mermaid modal and mermaid.js initialization

## [1.2.0] - 2026-04-26

### Added
- Agent file support in split-module architecture

### Changed
- ESLint configuration now uses `eslint-config-agent` as single source of truth
- Adopted Skill invocation syntax `Skill(skill="id")` for call edges parsing

### Fixed
- Coverage include updated to track split implementation files

## [1.1.2] - 2026-04-26

### Fixed
- Added repository field to package.json

## [1.1.1] - 2026-04-26

### Changed
- Pinned npm to 11.5.1 (minimum required for trusted publishing)

## [1.1.0] - 2026-04-26

### Added
- Agent file support alongside skills

## [1.0.0] - 2026-04-26

### Added
- Interactive force-directed graph visualization via vis-network
- Frontmatter parser for `SKILL.md` files
- Edge classification: `prerequisite`, `calls`, `suggests`, `references`
- Auto-detection of `.claude/skills/` by walking up the directory tree
- Outputs `graph.json` and `graph.html` to `.claude/graph/`
- Auto-gitignores output files on first run
- Spacing slider in the graph viewer
