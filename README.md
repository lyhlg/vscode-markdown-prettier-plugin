# Markdown Prettier

A beautiful markdown preview extension for VS Code / Cursor with colored headings, TOC sidebar, and Claude Code integration.

## Features

### Colored Headings

Each heading level has a distinct color for easy visual hierarchy:

- **H1** — Blue (`#61AFEF`) with bottom border
- **H2** — Green (`#98C379`) with bottom border
- **H3** — Yellow (`#E5C07B`)
- **H4** — Purple (`#C678DD`)

### Table of Contents Sidebar

- Auto-generated TOC on the left sidebar
- Click to smooth-scroll to the target section
- Active section is highlighted as you scroll
- Supports duplicate heading names

### Live Preview

- Preview updates in real-time as you edit
- Automatically switches when you open a different markdown file

### Ask Claude to Improve

- Select any text in the preview
- A floating toolbar appears with **"Ask Claude to Improve"**
- Click to send the selected text to Claude Code in the terminal

### Frontmatter Support

- YAML frontmatter (`---`) is automatically hidden from the preview

## Usage

1. Open any `.md` file
2. Press `Cmd + Shift + M` (macOS) / `Ctrl + Shift + M` (Windows/Linux)
   — or click the **MD icon** in the editor title bar
3. The preview opens in a side panel

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + Shift + M` | Open Markdown Preview |
| `Ctrl + Shift + M` | Open Markdown Preview (Windows/Linux) |
