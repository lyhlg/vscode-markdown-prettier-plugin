# Feature Enhancements Design

**Date:** 2026-02-24
**Target file:** `src/extension.ts`

## Features

### A-1. Syntax Highlighting
- Load `highlight.js` (atom-one-dark theme) via CDN
- Call `hljs.highlightAll()` after webview renders

### A-2. Mermaid Diagrams
- Load `mermaid.js` via CDN
- Preprocess ` ```mermaid ` blocks into `<div class="mermaid">...</div>` in TypeScript before passing to markdown-it

### B-1. Scroll Sync
- Use `onDidChangeTextEditorVisibleRanges` to detect editor scroll
- Compute nearest heading above the first visible line
- Post message to webview → smooth scroll to that heading

### B-2. Font Size Control
- Add `A-` / `A+` buttons in preview top-right corner
- Default 12px, range 10px–20px, 1px increments
- Persist via `vscode.getState()` / `vscode.setState()`
