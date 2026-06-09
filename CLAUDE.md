# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dools** is a cross-platform CLI tool for killing processes by port number. Published on npm, supports Windows/macOS/Linux.

## Commands

```bash
npm run build      # Build with tsup (outputs to dist/)
npm run dev        # Build in watch mode
npm run release    # Version bump with release-it
```

No test framework or linter is configured.

## Architecture

```
src/
├── index.ts           # CLI entry — registers Commander.js program and commands
├── commands/kill.ts   # `dools kill <port>` — validates port, finds PIDs, kills processes
├── utils/
│   ├── platform.ts    # Platform detection (isWindows/isMacOS/isLinux)
│   └── process.ts     # Core logic — findPidsByPort (netstat/lsof) and killPid (taskkill/kill)
└── types/index.ts     # ProcessInfo, KillResult, Platform types
```

**Platform-specific behavior** is the key architectural pattern: `process.ts` branches on OS to use `netstat -ano` + `taskkill` on Windows vs `lsof` + `kill -9` on Unix.

## Tech Stack

- TypeScript (ES2022, ES Modules)
- Commander.js for CLI
- tsup for bundling (ESM output + d.ts declarations)
- release-it for versioning
- GitHub Actions publishes to npm on `v*` tags (Node 20)
