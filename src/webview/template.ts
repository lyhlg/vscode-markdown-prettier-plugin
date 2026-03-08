import { renderMarkdown } from '../markdown';
import { getStyles } from './styles';
import { getScripts } from './scripts';

export function getMermaidInitScript(): string {
  return `
  const isLight = document.body.classList.contains('vscode-light');
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: isLight ? {
      primaryColor: '#dbeafe',
      primaryTextColor: '#1e3a5f',
      primaryBorderColor: '#3b82f6',
      secondaryColor: '#f0fdf4',
      secondaryTextColor: '#166534',
      secondaryBorderColor: '#22c55e',
      tertiaryColor: '#fef3c7',
      tertiaryTextColor: '#92400e',
      tertiaryBorderColor: '#f59e0b',
      lineColor: '#475569',
      arrowheadColor: '#475569',
      textColor: '#1e293b',
      mainBkg: '#dbeafe',
      nodeBorder: '#3b82f6',
      clusterBkg: '#f1f5f9',
      clusterBorder: '#94a3b8',
      titleColor: '#0f172a',
      edgeLabelBackground: '#ffffff',
      nodeTextColor: '#1e293b',
      actorLineColor: '#64748b',
      signalColor: '#334155',
      labelTextColor: '#334155',
    } : {
      primaryColor: '#1e3a5f',
      primaryTextColor: '#e2e8f0',
      primaryBorderColor: '#60a5fa',
      secondaryColor: '#14532d',
      secondaryTextColor: '#bbf7d0',
      secondaryBorderColor: '#4ade80',
      tertiaryColor: '#713f12',
      tertiaryTextColor: '#fef08a',
      tertiaryBorderColor: '#facc15',
      lineColor: '#58a6ff',
      arrowheadColor: '#58a6ff',
      textColor: '#e2e8f0',
      mainBkg: '#1e3a5f',
      nodeBorder: '#60a5fa',
      clusterBkg: '#1e293b',
      clusterBorder: '#475569',
      titleColor: '#f1f5f9',
      edgeLabelBackground: '#1e293b',
      nodeTextColor: '#e2e8f0',
      actorLineColor: '#58a6ff',
      actorTextColor: '#e2e8f0',
      actorBkg: '#1e3a5f',
      actorBorder: '#60a5fa',
      signalColor: '#cbd5e1',
      labelTextColor: '#cbd5e1',
      sectionBkgColor: '#1e293b',
      altSectionBkgColor: '#263445',
      sectionBkgColor2: '#1a2332',
      taskBkgColor: '#3b82f6',
      taskTextColor: '#e2e8f0',
      taskTextOutsideColor: '#cbd5e1',
      activeTaskBkgColor: '#60a5fa',
      activeTaskBorderColor: '#93c5fd',
      doneTaskBkgColor: '#475569',
      doneTaskBorderColor: '#64748b',
      gridColor: '#475569',
      todayLineColor: '#f59e0b',
    },
  });`;
}

export function getWebviewContent(markdown: string): string {
  const { renderedHtml, tocHtml, headingData } = renderMarkdown(markdown);
  const headingDataJson = JSON.stringify(headingData);
  const styles = getStyles();
  const scripts = getScripts();
  const mermaidInit = getMermaidInitScript();

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/dockerfile.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"><\/script>
<script>${mermaidInit}<\/script>
<style>${styles}</style>
</head>
<body>
  <div class="font-controls">
    <button class="font-btn" id="fontMinus">A−</button>
    <span class="font-size-label" id="fontSizeLabel">12px</span>
    <button class="font-btn" id="fontPlus">A+</button>
    <span class="font-controls-divider"></span>
    <button class="font-btn" id="presentBtn" title="Presentation Mode">▶</button>
    <span class="font-controls-divider"></span>
    <button class="font-btn" id="editBtn" title="Edit Markdown">✎</button>
    <span class="font-controls-divider"></span>
    <button class="font-btn" id="pdfBtn" title="Export PDF">PDF</button>
  </div>
  <div class="container">
    <nav class="toc" id="toc">
      <div class="toc-header">
        <span class="toc-title-text">Table of Contents</span>
        <button class="toc-toggle" id="tocToggle" title="TOC 접기">◀</button>
      </div>
      <div class="toc-search-wrap">
        <input type="text" class="toc-search" id="tocSearch" placeholder="Search headings..." spellcheck="false" />
      </div>
      <div class="toc-items">
        ${tocHtml}
      </div>
    </nav>
    <div class="toc-resize-handle" id="tocResizeHandle"></div>
    <main class="content">
      ${renderedHtml}
    </main>
    <textarea class="edit-textarea" id="editTextarea" spellcheck="false"></textarea>
  </div>

  <script id="heading-data" type="application/json">${headingDataJson}<\/script>
  <script id="raw-markdown" type="application/json">${JSON.stringify(markdown)}<\/script>

  <!-- Slide Navigation (visible in presentation mode) -->
  <div class="slide-nav" id="slideNav">
    <button class="slide-nav-btn" id="slidePrev">&#8592;</button>
    <span class="slide-counter" id="slideCounter">1 / 1</span>
    <button class="slide-nav-btn" id="slideNext">&#8594;</button>
    <button class="slide-nav-btn slide-exit-btn" id="slideExit">ESC</button>
  </div>

  <!-- Edit Status Bar -->
  <div class="edit-status">
    <span>EDIT MODE</span>
    <span><kbd>Ctrl+S</kbd> Save &nbsp; <kbd>Esc</kbd> Cancel</span>
  </div>

  <!-- Floating Toolbar (appears on text selection) -->
  <div class="floating-toolbar" id="toolbar">
    <button id="askClaudeBtn">
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
      Ask Claude to Improve
    </button>
  </div>

  <script>${scripts}<\/script>
</body>
</html>`;
}
