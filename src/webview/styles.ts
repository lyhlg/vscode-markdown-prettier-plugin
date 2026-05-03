export function getStyles(): string {
  return `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    line-height: 1.7;
    color: var(--vscode-editor-foreground, #d4d4d4);
    background: var(--vscode-editor-background, #1e1e1e);
  }

  .container {
    display: flex;
    height: 100vh;
  }

  /* ── TOC Sidebar ── */
  .toc {
    width: 240px;
    min-width: 120px;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 12px;
    border-right: none;
    background: var(--vscode-sideBar-background, #181818);
    position: sticky;
    top: 0;
    flex-shrink: 0;
    transition: width 0.2s ease, min-width 0.2s ease, padding 0.2s ease;
  }

  .toc.collapsed {
    width: 36px;
    min-width: 36px;
    padding: 12px 6px;
    overflow: hidden;
  }

  .toc.collapsed + .toc-resize-handle {
    display: none;
  }

  .toc.collapsed .toc-title-text,
  .toc.collapsed .toc-items {
    display: none;
  }

  .toc-resize-handle {
    width: 4px;
    cursor: col-resize;
    background: var(--vscode-panel-border, #333);
    flex-shrink: 0;
    transition: background 0.15s;
  }

  .toc-resize-handle:hover,
  .toc-resize-handle.dragging {
    background: var(--vscode-focusBorder, #007fd4);
  }

  .toc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
  }

  .toc.collapsed .toc-header {
    justify-content: center;
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .toc-title-text {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-sideBarSectionHeader-foreground, #999);
    white-space: nowrap;
  }

  .toc-toggle {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 10px;
    line-height: 1;
    flex-shrink: 0;
  }

  .toc-toggle:hover {
    color: #fff;
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }

  .toc-item {
    display: block;
    position: relative;
    padding: 4px 12px;
    margin: 1px 0;
    border-radius: 4px;
    text-decoration: none;
    color: var(--vscode-editor-foreground, #ccc);
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: background 0.15s;
  }

  .toc-guide {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    border-left: 1px dotted rgba(255,255,255,0.25);
    pointer-events: none;
  }

  .toc-item:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }

  .toc-item.active {
    background: var(--vscode-list-activeSelectionBackground, #094771);
    color: var(--vscode-list-activeSelectionForeground, #fff);
  }

  .toc-h1 { font-weight: 700; color: #ffffffee; }
  .toc-h2 { font-weight: 600; color: #ffffffcc; }
  .toc-h3 { font-weight: 400; color: #ffffffaa; }

  .toc-empty {
    color: #666;
    font-style: italic;
    font-size: 11px;
  }

  /* ── TOC Search ── */
  .toc-search-wrap {
    margin-bottom: 8px;
  }

  .toc.collapsed .toc-search-wrap {
    display: none;
  }

  .toc-search {
    width: 100%;
    padding: 5px 8px;
    font-size: 11px;
    border: 1px solid var(--vscode-input-border, #3c3c3c);
    border-radius: 4px;
    background: var(--vscode-input-background, #1e1e1e);
    color: var(--vscode-input-foreground, #cccccc);
    outline: none;
  }

  .toc-search:focus {
    border-color: var(--vscode-focusBorder, #007fd4);
  }

  .toc-search::placeholder {
    color: var(--vscode-input-placeholderForeground, #666);
  }

  .toc-item.toc-hidden {
    display: none;
  }

  .toc-item .toc-highlight {
    background: rgba(255, 213, 0, 0.35);
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }

  .toc-item.toc-child-of-match {
    opacity: 0.45;
  }

  .toc-item.toc-child-of-match:hover {
    opacity: 0.8;
  }

  /* ── Content Area ── */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 32px 48px;
    max-width: 100%;
    scroll-behavior: smooth;
    scroll-padding-top: 24px;
  }

  /* ── Headings ── */
  h1 {
    font-size: 2.33em;
    font-weight: 700;
    color: #ffffffee;
    margin: 32px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #ffffff22;
  }

  h2 {
    font-size: 1.83em;
    font-weight: 600;
    color: #ffffffcc;
    margin: 28px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid #ffffff18;
  }

  h3 {
    font-size: 1.5em;
    font-weight: 600;
    color: #ffffffaa;
    margin: 24px 0 10px 0;
  }

  h4 {
    font-size: 1.25em;
    font-weight: 600;
    color: #ffffff88;
    margin: 20px 0 8px 0;
  }

  h5 {
    font-size: 1.08em;
    font-weight: 600;
    color: #ffffff66;
    margin: 16px 0 8px 0;
  }

  h6 {
    font-size: 1.08em;
    font-weight: 600;
    color: #ffffff44;
    margin: 16px 0 8px 0;
  }

  h1:first-child { margin-top: 0; }

  /* ── Paragraphs & Text ── */
  p {
    margin: 10px 0;
  }

  a {
    color: #6CB6FF;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  strong { font-weight: 700; background: rgba(255,200,50,0.15); padding: 1px 4px; border-radius: 3px; }
  em { font-style: italic; }

  mark {
    background: linear-gradient(104deg, rgba(255,220,0,0) 0.9%, rgba(255,220,0,0.45) 2.4%, rgba(255,220,0,0.55) 5.8%, rgba(255,220,0,0.43) 93%, rgba(255,220,0,0.35) 96%, rgba(255,220,0,0) 98%);
    color: inherit;
    padding: 2px 6px;
    border-radius: 4px;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
  }

  /* ── Code ── */
  code {
    font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
    background: #383e4a;
    border: 1px solid #4b5263;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11.5px;
  }

  pre {
    margin: 12px 0;
    border-radius: 6px;
    overflow-x: auto;
    border: 1px solid #4b5263;
  }

  pre code.hljs {
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.6;
    padding: 16px;
  }

  pre code:not(.hljs) {
    background: #282c34;
    border: 1px solid #3e4451;
    padding: 16px;
    display: block;
  }

  /* ── Code Copy Button ── */
  pre {
    position: relative;
  }

  .code-copy-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 4px 8px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #999;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s, background 0.15s, color 0.15s;
    z-index: 1;
    line-height: 1;
  }

  pre:hover .code-copy-btn {
    opacity: 1;
  }

  .code-copy-btn:hover {
    background: rgba(255,255,255,0.12);
    color: #ddd;
  }

  .code-copy-btn.copied {
    color: #3fb950;
    border-color: #3fb950;
    opacity: 1;
  }

  /* ── Blockquote ── */
  blockquote {
    border-left: 4px solid #6CB6FF;
    margin: 12px 0;
    padding: 8px 16px;
    background: #6CB6FF0a;
    color: #abb2bf;
  }

  /* ── Callout (GitHub-style Admonitions) ── */
  .callout {
    margin: 12px 0;
    padding: 10px 14px;
    border-left: 3px solid;
    border-radius: 4px;
  }
  .callout-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .callout-title svg { flex-shrink: 0; width: 14px; height: 14px; }
  .callout-content p { margin: 3px 0; font-size: 14px; }

  .callout-note    { border-left-color: #2f81f7; background: rgba(47,129,247,0.08); }
  .callout-note .callout-title { color: #2f81f7; }

  .callout-tip     { border-left-color: #3fb950; background: rgba(63,185,80,0.08); }
  .callout-tip .callout-title { color: #3fb950; }

  .callout-important { border-left-color: #a371f7; background: rgba(163,113,247,0.08); }
  .callout-important .callout-title { color: #a371f7; }

  .callout-warning { border-left-color: #d29922; background: rgba(210,153,34,0.08); }
  .callout-warning .callout-title { color: #d29922; }

  .callout-caution { border-left-color: #f85149; background: rgba(248,81,73,0.08); }
  .callout-caution .callout-title { color: #f85149; }

  .callout-danger  { border-left-color: #f85149; background: rgba(248,81,73,0.08); }
  .callout-danger .callout-title { color: #f85149; }

  /* ── Mermaid Diagram Overrides ── */
  .mermaid {
    position: relative;
    overflow: visible;
    margin: 20px 0;
    padding: 16px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    text-align: center;
  }
  .mermaid svg { max-width: 100% !important; height: auto !important; transition: transform 0.15s ease; }

  /* Mermaid zoom controls */
  .mermaid-zoom-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .mermaid:hover .mermaid-zoom-controls { opacity: 1; }
  .mermaid-zoom-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(30,41,59,0.85);
    color: #e2e8f0;
    cursor: pointer;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0;
    backdrop-filter: blur(4px);
  }
  .mermaid-zoom-btn:hover { background: rgba(30,41,59,1); }
  .mermaid.zoomed { cursor: grab; user-select: none; overflow: hidden; }
  .mermaid.zoomed.panning { cursor: grabbing; }
  .mermaid.zoomed .mermaid-zoom-controls { opacity: 1; }

  body.vscode-light .mermaid-zoom-btn {
    border-color: rgba(0,0,0,0.15);
    background: rgba(255,255,255,0.85);
    color: #1e293b;
  }
  body.vscode-light .mermaid-zoom-btn:hover { background: rgba(255,255,255,1); }

  /* Universal: all SVG lines, paths, markers in mermaid */
  .mermaid svg path[class*="transition"],
  .mermaid svg path.relation,
  .mermaid svg path.flowchart-link,
  .mermaid svg .edgePath path,
  .mermaid svg line[class*="line"],
  .mermaid svg .er.relationshipLine { stroke: #58a6ff !important; stroke-width: 2px !important; }

  .mermaid svg marker path,
  .mermaid svg marker circle,
  .mermaid svg marker line,
  .mermaid svg marker polygon,
  .mermaid svg .arrowheadPath,
  .mermaid svg defs marker path,
  .mermaid svg defs marker circle,
  .mermaid svg defs marker polygon,
  .mermaid svg [id*="arrowhead"] path,
  .mermaid svg [id*="crosshead"] path,
  .mermaid svg [id*="arrow"] path { fill: #58a6ff !important; stroke: #58a6ff !important; }

  /* Catch-all: any line/path that mermaid draws as connectors */
  .mermaid svg line { stroke: #58a6ff !important; stroke-width: 1.5px !important; }
  .mermaid svg [id^="rel"] path { stroke: #58a6ff !important; stroke-width: 2px !important; }

  /* Edge labels */
  .mermaid .edgeLabel { background-color: #1e293b !important; color: #cbd5e1 !important; font-size: 12px !important; }
  .mermaid .edgeLabel rect { fill: #1e293b !important; opacity: 0.85; }
  .mermaid .edgeLabel span { color: #cbd5e1 !important; }

  /* Class diagram specific */
  .mermaid .classLabel .label { font-size: 12px !important; }
  .mermaid .cardinality { fill: #cbd5e1 !important; font-size: 12px !important; }

  /* Sequence diagram */
  .mermaid .messageLine0, .mermaid .messageLine1 { stroke: #58a6ff !important; stroke-width: 1.5px !important; }
  .mermaid .messageText { fill: #cbd5e1 !important; font-size: 12px !important; }
  .mermaid .actor-line { stroke: #58a6ff !important; stroke-width: 1.5px !important; }
  .mermaid .activation0, .mermaid .activation1 { fill: #334155 !important; stroke: #60a5fa !important; }
  .mermaid text.actor-box, .mermaid .actor text,
  .mermaid text[class*="actor"] { fill: #e2e8f0 !important; }
  .mermaid .actor { fill: #1e3a5f !important; stroke: #60a5fa !important; }

  /* Gantt chart */
  .mermaid .grid .tick text { fill: #cbd5e1 !important; }
  .mermaid .grid .tick line { stroke: #475569 !important; }
  .mermaid .sectionTitle { fill: #e2e8f0 !important; font-size: 13px !important; }
  .mermaid .taskText { fill: #e2e8f0 !important; font-size: 12px !important; }
  .mermaid .taskTextOutsideRight { fill: #cbd5e1 !important; }
  .mermaid .titleText { fill: #f1f5f9 !important; }

  /* ER diagram */
  .mermaid .er.attributeBoxOdd, .mermaid .er.attributeBoxEven { fill: #1e293b !important; stroke: #475569 !important; }
  .mermaid .er.entityBox { fill: #1e3a5f !important; stroke: #60a5fa !important; }
  .mermaid .er.entityLabel { fill: #e2e8f0 !important; }

  /* State diagram */
  .mermaid .statediagram-state rect.basic { stroke: #60a5fa !important; }

  /* Git graph */
  .mermaid .commit-label { fill: #cbd5e1 !important; font-size: 11px !important; }

  /* Node text */
  .mermaid .nodeLabel { font-size: 13px !important; }
  .mermaid .label { font-size: 13px !important; }

  /* Light mode */
  body.vscode-light .mermaid {
    background: rgba(0,0,0,0.02);
    border-color: rgba(0,0,0,0.08);
  }
  body.vscode-light .mermaid svg path.relation,
  body.vscode-light .mermaid svg path.flowchart-link,
  body.vscode-light .mermaid svg .edgePath path,
  body.vscode-light .mermaid svg path[class*="transition"],
  body.vscode-light .mermaid svg line,
  body.vscode-light .mermaid svg [id^="rel"] path { stroke: #475569 !important; }
  body.vscode-light .mermaid svg marker path,
  body.vscode-light .mermaid svg marker circle,
  body.vscode-light .mermaid svg marker polygon,
  body.vscode-light .mermaid svg .arrowheadPath,
  body.vscode-light .mermaid svg defs marker path,
  body.vscode-light .mermaid svg defs marker circle,
  body.vscode-light .mermaid svg defs marker polygon,
  body.vscode-light .mermaid svg [id*="arrowhead"] path,
  body.vscode-light .mermaid svg [id*="arrow"] path { fill: #475569 !important; stroke: #475569 !important; }
  body.vscode-light .mermaid .edgeLabel { background-color: #ffffff !important; }
  body.vscode-light .mermaid .edgeLabel rect { fill: #ffffff !important; }
  body.vscode-light .mermaid .edgeLabel span { color: #334155 !important; }
  body.vscode-light .mermaid .messageLine0,
  body.vscode-light .mermaid .messageLine1 { stroke: #475569 !important; }
  body.vscode-light .mermaid .messageText { fill: #334155 !important; }
  body.vscode-light .mermaid .cardinality { fill: #334155 !important; }

  /* ── Lists ── */
  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin: 4px 0;
  }

  /* ── Table ── */
  table {
    border-collapse: collapse;
    width: auto;
    margin: 12px 0;
  }

  th, td {
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    padding: 6px 16px 6px 0;
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: 600;
    border-bottom: 1px solid rgba(255,255,255,0.2);
  }

  tr:last-child td {
    border-bottom: none;
  }

  /* ── Horizontal Rule ── */
  hr {
    border: none;
    height: 1px;
    background: #555;
    margin: 24px 0;
  }

  /* ── Image ── */
  img {
    max-width: 100%;
    border-radius: 6px;
    margin: 8px 0;
  }

  /* ── Keyboard Keys ── */
  kbd {
    display: inline-block;
    padding: 2px 7px;
    font-family: inherit;
    font-size: 0.85em;
    line-height: 1.4;
    color: #e2e8f0;
    background: #2a2d35;
    border: 1px solid rgba(255,255,255,0.15);
    border-bottom-width: 2px;
    border-radius: 5px;
    box-shadow: 0 1px 1px rgba(0,0,0,0.2);
    vertical-align: baseline;
  }
  body.vscode-light kbd {
    color: #24292f;
    background: #f6f8fa;
    border-color: rgba(0,0,0,0.15);
    box-shadow: 0 1px 1px rgba(0,0,0,0.08);
  }

  /* ── Checkbox ── */
  input[type="checkbox"] {
    margin-right: 6px;
  }

  /* ── Floating Toolbar ── */
  .floating-toolbar {
    display: none;
    position: fixed;
    background: #21252b;
    border: 1px solid #3e4451;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    z-index: 9999;
    animation: fadeIn 0.15s ease;
  }

  .floating-toolbar.visible {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .floating-toolbar button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: #6CB6FF22;
    color: #6CB6FF;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .floating-toolbar button:hover {
    background: #6CB6FF44;
  }

  .floating-toolbar button svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #555; }

  /* ── Light Mode Overrides ── */
  body.vscode-light h1 { color: #000000ee; border-bottom-color: #00000022; }
  body.vscode-light h2 { color: #000000cc; border-bottom-color: #00000018; }
  body.vscode-light h3 { color: #000000aa; }
  body.vscode-light h4 { color: #00000088; }
  body.vscode-light h5 { color: #00000066; }
  body.vscode-light h6 { color: #00000044; }
  body.vscode-light strong { background: rgba(255,170,0,0.12); }
  body.vscode-light mark {
    background: linear-gradient(104deg, rgba(255,200,0,0) 0.9%, rgba(255,200,0,0.5) 2.4%, rgba(255,200,0,0.6) 5.8%, rgba(255,200,0,0.48) 93%, rgba(255,200,0,0.4) 96%, rgba(255,200,0,0) 98%);
  }

  body.vscode-light .toc-h1 { color: #000000ee; }
  body.vscode-light .toc-h2 { color: #000000cc; }
  body.vscode-light .toc-h3 { color: #000000aa; }

  body.vscode-light code {
    background: #f0f2f5;
    border-color: #d0d7de;
    color: #24292f;
  }

  body.vscode-light pre { border-color: #d0d7de; }

  body.vscode-light pre code:not(.hljs) {
    background: #f6f8fa;
    border-color: #d0d7de;
    color: #24292f;
  }

  body.vscode-light th, body.vscode-light td {
    border-bottom-color: rgba(0,0,0,0.08);
    color: #24292f;
  }

  body.vscode-light th {
    border-bottom-color: rgba(0,0,0,0.2);
    color: #1a1a1a;
  }

  body.vscode-light blockquote {
    color: #555;
    border-left-color: #2c3e50;
    background: #f6f8fa;
  }

  body.vscode-light .callout-note    { background: rgba(9,105,218,0.06); }
  body.vscode-light .callout-tip     { background: rgba(26,127,55,0.06); }
  body.vscode-light .callout-important { background: rgba(130,80,223,0.06); }
  body.vscode-light .callout-warning { background: rgba(154,103,0,0.06); }
  body.vscode-light .callout-caution { background: rgba(207,34,46,0.06); }
  body.vscode-light .callout-danger  { background: rgba(207,34,46,0.06); }
  body.vscode-light .callout-note .callout-title { color: #0969da; }
  body.vscode-light .callout-tip .callout-title { color: #1a7f37; }
  body.vscode-light .callout-important .callout-title { color: #8250df; }
  body.vscode-light .callout-warning .callout-title { color: #9a6700; }
  body.vscode-light .callout-caution .callout-title { color: #cf222e; }
  body.vscode-light .callout-danger .callout-title { color: #cf222e; }

  body.vscode-light hr { background: #d0d7de; }

  body.vscode-light a { color: #0969da; }
  body.vscode-light .toc-item { color: #333; }

  body.vscode-light .toc-guide { border-left-color: rgba(0,0,0,0.15); }
  body.vscode-light .toc-toggle { color: #888; }
  body.vscode-light .toc-toggle:hover { color: #333; background: #e8e8e8; }

  body.vscode-light .floating-toolbar { background: #fff; border-color: #d0d7de; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  body.vscode-light .floating-toolbar button { background: #0969da22; color: #0969da; }
  body.vscode-light .floating-toolbar button:hover { background: #0969da44; }

  body.vscode-light ::-webkit-scrollbar-thumb { background: #ccc; }
  body.vscode-light ::-webkit-scrollbar-thumb:hover { background: #aaa; }

  body.vscode-light .slide-nav { background: #fff; border-color: #d0d7de; box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
  body.vscode-light .font-btn:hover { color: #333; }

  /* highlight.js light mode overrides */
  body.vscode-light .hljs { background: #f6f8fa !important; color: #24292f; }
  body.vscode-light .hljs-comment, body.vscode-light .hljs-quote { color: #6a737d; }
  body.vscode-light .hljs-keyword, body.vscode-light .hljs-selector-tag { color: #cf222e; }
  body.vscode-light .hljs-string, body.vscode-light .hljs-addition { color: #116329; }
  body.vscode-light .hljs-number, body.vscode-light .hljs-literal { color: #0550ae; }
  body.vscode-light .hljs-title, body.vscode-light .hljs-section { color: #0550ae; font-weight: bold; }
  body.vscode-light .hljs-title.function_ { color: #8250df; }
  body.vscode-light .hljs-variable, body.vscode-light .hljs-tag { color: #116329; }
  body.vscode-light .hljs-attr, body.vscode-light .hljs-attribute { color: #0550ae; }
  body.vscode-light .hljs-built_in, body.vscode-light .hljs-type { color: #953800; }
  body.vscode-light .hljs-params { color: #24292f; }
  body.vscode-light .hljs-symbol, body.vscode-light .hljs-bullet { color: #0550ae; }
  body.vscode-light .hljs-meta { color: #0550ae; }
  body.vscode-light .hljs-deletion { color: #82071e; background: #ffebe9; }
  body.vscode-light .hljs-name { color: #116329; }
  body.vscode-light .hljs-subst { color: #24292f; }

  /* ── Font Controls ── */
  .font-controls {
    position: fixed;
    top: 12px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 100;
    background: var(--vscode-editor-background, #21252b);
    border: 1px solid var(--vscode-panel-border, #3e4451);
    border-radius: 6px;
    padding: 4px 8px;
  }

  .font-btn {
    background: none;
    border: none;
    color: var(--vscode-editor-foreground, #abb2bf);
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    padding: 0 2px;
    line-height: 1;
  }

  .font-btn:hover { color: #fff; }

  #pdfBtn { font-size: 10px; letter-spacing: 0.5px; }

  .font-size-label {
    font-size: 11px;
    color: #666;
    min-width: 30px;
    text-align: center;
  }

  .font-controls-divider {
    width: 1px;
    height: 16px;
    background: var(--vscode-panel-border, #3e4451);
    margin: 0 2px;
  }

  /* ── Inline Edit ── */
  [data-line-start] {
    cursor: default;
    border-radius: 4px;
    transition: outline 0.15s;
  }

  [data-line-start]:hover {
    outline: 1px dashed var(--vscode-panel-border, #3e4451);
    outline-offset: 4px;
  }

  .inline-editor {
    border: 2px solid #6CB6FF;
    border-radius: 6px;
    margin: 8px 0;
    overflow: hidden;
  }

  .inline-edit-textarea {
    width: 100%;
    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #d4d4d4);
    border: none;
    outline: none;
    resize: none;
    font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 12px 16px;
    min-height: 60px;
    display: block;
  }

  .inline-edit-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    padding: 6px 12px;
    background: #282c34;
    border-top: 1px solid #3e4451;
  }

  .inline-edit-hint {
    font-size: 11px;
    color: #666;
    margin-right: auto;
  }

  .inline-edit-save, .inline-edit-cancel {
    border: none;
    border-radius: 4px;
    padding: 4px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
  }

  .inline-edit-save {
    background: #6CB6FF;
    color: #fff;
  }

  .inline-edit-save:hover { background: #4d9ee0; }

  .inline-edit-cancel {
    background: #3e4451;
    color: #abb2bf;
  }

  .inline-edit-cancel:hover { background: #4b5263; }

  body.vscode-light .inline-edit-textarea {
    caret-color: #24292f;
  }

  body.vscode-light .inline-edit-toolbar {
    background: #f0f2f5;
    border-top-color: #d0d7de;
  }

  body.vscode-light .inline-edit-save { background: #0969da; }
  body.vscode-light .inline-edit-cancel { background: #d0d7de; color: #24292f; }

  /* ── Edit Mode ── */
  body.edit-mode .content {
    display: none;
  }

  .edit-textarea {
    display: none;
    flex: 1;
    width: 100%;
    background: var(--vscode-editor-background, #1e1e1e);
    color: var(--vscode-editor-foreground, #d4d4d4);
    border: none;
    outline: none;
    resize: none;
    font-family: 'Fira Code', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace;
    font-size: 13px;
    line-height: 1.7;
    padding: 32px 48px;
    tab-size: 2;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  body.edit-mode .edit-textarea {
    display: block;
  }

  .edit-status {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 28px;
    background: var(--vscode-statusBar-background, #007acc);
    color: var(--vscode-statusBar-foreground, #fff);
    font-size: 11px;
    line-height: 28px;
    padding: 0 12px;
    z-index: 10000;
    justify-content: space-between;
  }

  body.edit-mode .edit-status {
    display: flex;
  }

  .edit-status kbd {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
  }

  body.vscode-light .edit-textarea {
    caret-color: #24292f;
  }

  /* ── Presentation Mode ── */
  body.presentation-mode .container {
    height: 100vh;
    overflow: hidden;
  }

  body.presentation-mode .toc,
  body.presentation-mode .font-controls {
    display: none;
  }

  body.presentation-mode .content {
    overflow: hidden;
    padding: 0;
    position: relative;
    width: 100%;
    height: 100vh;
  }

  .slide { /* no special styling in normal mode */ }

  body.presentation-mode .slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 64px 80px;
    box-sizing: border-box;
    opacity: 0;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.4s ease;
    pointer-events: none;
    overflow-y: auto;
  }

  body.presentation-mode .slide > * {
    max-width: 900px;
    width: 100%;
  }

  body.presentation-mode .slide.slide-active {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  body.presentation-mode .slide.slide-prev {
    opacity: 0;
    transform: translateX(-100%);
  }

  .slide-nav {
    display: none;
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--vscode-editor-background, #21252b);
    border: 1px solid var(--vscode-panel-border, #3e4451);
    border-radius: 8px;
    padding: 6px 16px;
    gap: 12px;
    align-items: center;
    z-index: 10000;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }

  body.presentation-mode .slide-nav { display: flex; }

  .slide-nav-btn {
    background: none;
    border: none;
    color: var(--vscode-editor-foreground, #abb2bf);
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .slide-nav-btn:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }

  .slide-exit-btn {
    font-size: 11px;
    font-weight: 600;
    margin-left: 8px;
    padding: 4px 10px;
    border: 1px solid var(--vscode-panel-border, #3e4451);
  }

  .slide-counter {
    font-size: 13px;
    color: var(--vscode-editor-foreground, #abb2bf);
    min-width: 60px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }`;
}
