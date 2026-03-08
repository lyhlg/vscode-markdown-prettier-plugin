import { renderMarkdown } from '../markdown';

export function getPdfHtml(markdown: string): string {
  const { renderedHtml } = renderMarkdown(markdown);

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/dockerfile.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
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
  });</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    line-height: 1.7;
    color: #d4d4d4;
    background: #1e1e1e;
    padding: 40px 48px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: A4;
    margin: 20mm 15mm;
  }

  h1 { font-size: 2.33em; font-weight: 700; color: #000000ee; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #00000022; }
  h2 { font-size: 1.83em; font-weight: 600; color: #000000cc; margin: 28px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #00000018; page-break-after: avoid; }
  h3 { font-size: 1.5em; font-weight: 600; color: #000000aa; margin: 24px 0 10px 0; page-break-after: avoid; }
  h4 { font-size: 1.25em; font-weight: 600; color: #00000088; margin: 20px 0 8px 0; }
  h5 { font-size: 1.08em; font-weight: 600; color: #00000066; margin: 16px 0 8px 0; }
  h6 { font-size: 1.08em; font-weight: 600; color: #00000044; margin: 16px 0 8px 0; }
  h1:first-child { margin-top: 0; }

  p { margin: 10px 0; }
  a { color: #6CB6FF; text-decoration: none; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  mark { background: rgba(255,200,0,0.5); color: #000; padding: 2px 6px; border-radius: 4px; }

  code {
    font-family: 'Fira Code', 'JetBrains Mono', Consolas, monospace;
    background: #383e4a;
    border: 1px solid #4b5263;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11.5px;
  }

  pre { margin: 12px 0; border-radius: 6px; overflow-x: auto; border: 1px solid #4b5263; page-break-inside: avoid; }
  pre code.hljs { border-radius: 6px; font-size: 12px; line-height: 1.6; padding: 16px; }
  pre code:not(.hljs) { background: #282c34; border: 1px solid #3e4451; padding: 16px; display: block; }

  blockquote { border-left: 4px solid #6CB6FF; margin: 12px 0; padding: 8px 16px; background: #6CB6FF0a; color: #abb2bf; }

  .callout { margin: 16px 0; padding: 12px 16px; border-left: 4px solid; border-radius: 6px; page-break-inside: avoid; }
  .callout-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; margin-bottom: 6px; }
  .callout-title svg { flex-shrink: 0; }
  .callout-content p { margin: 4px 0; }
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

  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }

  table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; }
  th, td { border: 1px solid #3e4451; padding: 8px 12px; text-align: left; }
  th { background: #2c313a; font-weight: 600; }
  tr:nth-child(even) { background: #2c313a44; }

  hr { border: none; border-top: 1px solid #3e4451; margin: 24px 0; }
  img { max-width: 100%; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
  input[type="checkbox"] { margin-right: 6px; }

  .mermaid { page-break-inside: avoid; margin: 20px 0; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
  .mermaid svg { max-width: 100% !important; }
  .mermaid svg[aria-roledescription="gantt"],
  .mermaid svg[aria-roledescription="sequence"],
  .mermaid svg[aria-roledescription="er"] { width: 100% !important; }
  .mermaid .flowchart-link, .mermaid .edgePath .path { stroke: #58a6ff !important; stroke-width: 2px !important; }
  .mermaid svg path.relation, .mermaid svg [id^="rel"] path { stroke: #58a6ff !important; stroke-width: 2px !important; }
  .mermaid marker path, .mermaid marker circle, .mermaid marker polygon, .mermaid .arrowheadPath,
  .mermaid [id*="arrowhead"] path, .mermaid [id*="arrow"] path { fill: #58a6ff !important; stroke: #58a6ff !important; }
  .mermaid .edgeLabel { background-color: #1e293b !important; }
  .mermaid .edgeLabel rect { fill: #1e293b !important; opacity: 0.85; }
  .mermaid .edgeLabel span { color: #cbd5e1 !important; }
  .mermaid line { stroke: #58a6ff !important; }
  .mermaid .messageLine0, .mermaid .messageLine1 { stroke: #58a6ff !important; stroke-width: 1.5px !important; }
  .mermaid .messageText { fill: #cbd5e1 !important; }
  .mermaid text.actor-box, .mermaid .actor text, .mermaid text[class*="actor"] { fill: #e2e8f0 !important; }
  .mermaid .actor { fill: #1e3a5f !important; stroke: #60a5fa !important; }
  .mermaid .sectionTitle { fill: #e2e8f0 !important; }
  .mermaid .taskText, .mermaid .taskTextOutsideRight { fill: #e2e8f0 !important; }
  .mermaid .titleText { fill: #f1f5f9 !important; }
  .mermaid .nodeLabel, .mermaid .label { font-size: 13px !important; }
</style>
</head>
<body>
  ${renderedHtml}
  <script>
    document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
  </script>
</body>
</html>`;
}
