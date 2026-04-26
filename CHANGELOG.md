# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
