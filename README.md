# Markdown Prettier

A beautiful markdown preview extension for VS Code / Cursor with colored headings, TOC sidebar, presentation mode, and Claude Code integration.

## Features

### Colored Headings

Each heading level has a distinct color for easy visual hierarchy:

- **H1** — Blue (`#61AFEF`) with bottom border
- **H2** — Green (`#98C379`) with bottom border
- **H3** — Yellow (`#E5C07B`)
- **H4** — Purple (`#C678DD`)
- **H5/H6** — Gray (`#ABB2BF`)

### Table of Contents Sidebar

- Auto-generated TOC on the left sidebar
- Click to smooth-scroll to the target section
- Active section is highlighted as you scroll
- Collapsible sidebar with toggle button
- Supports duplicate heading names
- Dotted indent guide lines for clear depth hierarchy
- Drag-resizable sidebar width (120px–500px)

### Presentation Mode

Turn your markdown into a slide presentation instantly:

- Use `---` (horizontal rules) as slide separators
- Click the **Play button (▶)** in the top-right controls to enter presentation mode
- Navigate with **Arrow keys** (Left/Right), **Space** (next), **Home/End** (first/last)
- Press **ESC** to exit back to normal preview
- Smooth sliding transition animations
- Slide counter display (e.g., `3 / 12`)

### Syntax Highlighting

- Code blocks are highlighted with [highlight.js](https://highlightjs.org/) (Atom One Dark theme)
- Supports all major programming languages
- Light mode uses a matching light theme

### Mermaid Diagrams

- Render [Mermaid](https://mermaid.js.org/) diagrams directly in the preview
- Auto-detects light/dark theme for diagram styling

### Scroll Synchronization

- Editor scroll position syncs to the preview
- Heading-based scroll tracking for accurate positioning

### Font Size Controls

- **A+** / **A-** buttons in the top-right corner
- All content including headings scales proportionally
- Font size preference is persisted across sessions

### Ask Claude to Improve

- Select any text in the preview
- A floating toolbar appears with **"Ask Claude to Improve"**
- Click to send the selected text to Claude Code in the terminal

### Live Preview

- Preview updates in real-time as you edit
- Automatically switches when you open a different markdown file

### Frontmatter Support

- YAML frontmatter (`---`) is automatically hidden from the preview

### Light & Dark Mode

- Fully supports VS Code light and dark themes
- All colors, code blocks, and UI elements adapt automatically

## Usage

1. Open any `.md` file
2. Press `Cmd + Shift + M` (macOS) / `Ctrl + Shift + M` (Windows/Linux)
   — or click the **MD icon** in the editor title bar
3. The preview opens in the current panel

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + Shift + M` | Open Markdown Preview |
| `Ctrl + Shift + M` | Open Markdown Preview (Windows/Linux) |

### In Presentation Mode

| Shortcut | Action |
|----------|--------|
| `←` / `→` | Previous / Next slide |
| `Space` | Next slide |
| `Home` / `End` | First / Last slide |
| `ESC` | Exit presentation mode |