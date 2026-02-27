import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Plugin: inject source line numbers on block-level tokens
md.core.ruler.push('source_line_numbers', (state) => {
  const offset: number = (state.env && state.env.fmOffset) || 0;
  for (const token of state.tokens) {
    if (token.map && token.nesting !== -1) {
      token.attrPush(['data-line-start', String(token.map[0] + offset)]);
      token.attrPush(['data-line-end', String(token.map[1] + offset)]);
    }
  }
});

let claudeTerminal: vscode.Terminal | undefined;

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('markdownViewer.open', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage('Please open a markdown file first.');
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'markdownViewer',
      `Preview: ${getFileName(editor.document.uri)}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const updateWebview = () => {
      const text = editor.document.getText();
      panel.webview.html = getWebviewContent(text);
    };

    let isEditMode = false;

    updateWebview();

    // Receive messages from Webview
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'askClaude') {
        const selectedText = message.text;
        const prompt = `Please improve the following markdown:\n\n${selectedText}`;
        sendToClaudeTerminal(prompt);
      } else if (message.type === 'editSave') {
        const doc = editor.document;
        const fullRange = new vscode.Range(
          doc.positionAt(0),
          doc.positionAt(doc.getText().length)
        );
        const wsEdit = new vscode.WorkspaceEdit();
        wsEdit.replace(doc.uri, fullRange, message.text);
        await vscode.workspace.applyEdit(wsEdit);
        await doc.save();
        isEditMode = false;
      } else if (message.type === 'inlineEditSave') {
        const doc = editor.document;
        const startLine = message.lineStart;
        const endLine = Math.min(message.lineEnd, doc.lineCount);
        const range = new vscode.Range(
          new vscode.Position(startLine, 0),
          endLine < doc.lineCount
            ? new vscode.Position(endLine, 0)
            : doc.lineAt(doc.lineCount - 1).range.end
        );
        let newText = message.text;
        if (endLine < doc.lineCount && !newText.endsWith('\n')) {
          newText += '\n';
        }
        const inlineEdit = new vscode.WorkspaceEdit();
        inlineEdit.replace(doc.uri, range, newText);
        await vscode.workspace.applyEdit(inlineEdit);
        await doc.save();
      } else if (message.type === 'exportPdf') {
        const doc = editor.document;
        const mdPath = doc.uri.fsPath;
        const markdown = doc.getText();

        panel.webview.postMessage({ type: 'pdfStatus', status: 'generating' });

        try {
          const pdfPath = await exportToPdf(markdown, mdPath);
          panel.webview.postMessage({ type: 'pdfStatus', status: 'done' });
          const openAction = await vscode.window.showInformationMessage(
            `PDF exported: ${path.basename(pdfPath)}`,
            'Open PDF', 'Show in Finder'
          );
          if (openAction === 'Open PDF') {
            vscode.env.openExternal(vscode.Uri.file(pdfPath));
          } else if (openAction === 'Show in Finder') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(pdfPath));
          }
        } catch (err: any) {
          panel.webview.postMessage({ type: 'pdfStatus', status: 'error' });
          vscode.window.showErrorMessage(`PDF export failed: ${err.message}`);
        }
      } else if (message.type === 'editModeChanged') {
        isEditMode = message.active;
      }
    });

    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === editor.document && !isEditMode) {
        updateWebview();
      }
    });

    const switchDisposable = vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.languageId === 'markdown') {
        panel.title = `Preview: ${getFileName(e.document.uri)}`;
        panel.webview.html = getWebviewContent(e.document.getText());
      }
    });

    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
    const scrollDisposable = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      if (e.textEditor === editor && e.visibleRanges.length > 0) {
        if (scrollTimeout !== undefined) { clearTimeout(scrollTimeout); }
        scrollTimeout = setTimeout(() => {
          const firstLine = e.visibleRanges[0].start.line;
          panel.webview.postMessage({ type: 'syncScroll', line: firstLine });
        }, 150);
      }
    });

    panel.onDidDispose(() => {
      changeDisposable.dispose();
      switchDisposable.dispose();
      scrollDisposable.dispose();
    });
  });

  // Release reference when terminal is closed
  vscode.window.onDidCloseTerminal(t => {
    if (t === claudeTerminal) {
      claudeTerminal = undefined;
    }
  });

  context.subscriptions.push(disposable);
}

function sendToClaudeTerminal(prompt: string) {
  // Reuse existing Claude terminal or create a new one
  if (!claudeTerminal || claudeTerminal.exitStatus !== undefined) {
    claudeTerminal = vscode.window.createTerminal({
      name: 'Claude Code',
      iconPath: new vscode.ThemeIcon('sparkle'),
    });
  }

  claudeTerminal.show();

  // Escape special characters and send to terminal
  const escaped = prompt.replace(/'/g, "'\\''");
  claudeTerminal.sendText(`claude '${escaped}'`);
}

function getFileName(uri: vscode.Uri): string {
  return uri.path.split('/').pop() || 'Markdown';
}

interface Heading {
  level: number;
  text: string;
  id: string;
  line: number;
}

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const idCount: Record<string, number> = {};
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[#*_`\[\]]/g, '').trim();
      let id = text
        .toLowerCase()
        .replace(/[^\w\s\u3131-\uD79D-]/g, '')
        .replace(/\s+/g, '-');

      // Append suffix for duplicate IDs
      if (idCount[id] !== undefined) {
        idCount[id]++;
        id = `${id}-${idCount[id]}`;
      } else {
        idCount[id] = 0;
      }

      headings.push({ level, text, id, line: i });
    }
  }

  return headings;
}

function generateTocHtml(headings: Heading[]): string {
  if (headings.length === 0) {
    return '<p class="toc-empty">No headings found</p>';
  }

  return headings
    .map(h => {
      const indent = (h.level - 1) * 16;
      return `<a class="toc-item toc-h${h.level}" href="#${h.id}" style="padding-left: ${indent}px">${h.text}</a>`;
    })
    .join('\n');
}

function addHeadingIds(html: string, headings: Heading[]): string {
  let result = html;
  for (const h of headings) {
    const tagRegex = new RegExp(`<h${h.level}([ >])`, '');
    result = result.replace(tagRegex, `<h${h.level} id="${h.id}"$1`);
  }
  return result;
}

function stripFrontmatter(markdown: string): { text: string; offset: number } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (match) {
    const offset = match[0].split('\n').length - 1;
    return { text: markdown.slice(match[0].length), offset };
  }
  return { text: markdown, offset: 0 };
}

function preprocessMermaid(markdown: string): { processed: string; blocks: string[] } {
  const blocks: string[] = [];
  const processed = markdown.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (_, content) => {
      const idx = blocks.length;
      blocks.push(content);
      return `\n\nMERMAID_PLACEHOLDER_${idx}\n\n`;
    }
  );
  return { processed, blocks };
}

function getWebviewContent(markdown: string): string {
  const { text: stripped, offset: fmOffset } = stripFrontmatter(markdown);
  const { processed, blocks } = preprocessMermaid(stripped);
  const headings = extractHeadings(stripped);
  let renderedHtml = md.render(processed, { fmOffset });
  renderedHtml = addHeadingIds(renderedHtml, headings);
  // Replace placeholders with mermaid divs after markdown-it rendering
  blocks.forEach((content, idx) => {
    renderedHtml = renderedHtml.replace(
      new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
      `<div class="mermaid">${content}</div>`
    );
  });
  const tocHtml = generateTocHtml(headings);
  const headingData = JSON.stringify(headings.map(h => ({ id: h.id, line: h.line })));

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
<script>
  const mermaidTheme = document.body.classList.contains('vscode-light') ? 'default' : 'dark';
  mermaid.initialize({ startOnLoad: true, theme: mermaidTheme });
</script>
<style>
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
    min-width: 240px;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px 12px;
    border-right: 1px solid var(--vscode-panel-border, #333);
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

  .toc.collapsed .toc-title-text,
  .toc.collapsed .toc-items {
    display: none;
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
    padding: 4px 8px;
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

  .toc-item:hover {
    background: var(--vscode-list-hoverBackground, #2a2d2e);
  }

  .toc-item.active {
    background: var(--vscode-list-activeSelectionBackground, #094771);
    color: var(--vscode-list-activeSelectionForeground, #fff);
  }

  .toc-h1 { font-weight: 700; color: #61AFEF; }
  .toc-h2 { font-weight: 600; color: #98C379; }
  .toc-h3 { font-weight: 400; color: #E5C07B; }

  .toc-empty {
    color: #666;
    font-style: italic;
    font-size: 11px;
  }

  /* ── Content Area ── */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 32px 48px;
    max-width: 100%;
  }

  /* ── Headings ── */
  h1 {
    font-size: 2.33em;
    font-weight: 700;
    color: #61AFEF;
    margin: 32px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #61AFEF44;
  }

  h2 {
    font-size: 1.83em;
    font-weight: 600;
    color: #98C379;
    margin: 28px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid #98C37944;
  }

  h3 {
    font-size: 1.5em;
    font-weight: 600;
    color: #E5C07B;
    margin: 24px 0 10px 0;
  }

  h4 {
    font-size: 1.25em;
    font-weight: 600;
    color: #C678DD;
    margin: 20px 0 8px 0;
  }

  h5, h6 {
    font-size: 1.08em;
    font-weight: 600;
    color: #ABB2BF;
    margin: 16px 0 8px 0;
  }

  h1:first-child { margin-top: 0; }

  /* ── Paragraphs & Text ── */
  p {
    margin: 10px 0;
  }

  a {
    color: #61AFEF;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }

  strong { font-weight: 700; }
  em { font-style: italic; }

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

  /* ── Blockquote ── */
  blockquote {
    border-left: 4px solid #61AFEF;
    margin: 12px 0;
    padding: 8px 16px;
    background: #61AFEF0a;
    color: #abb2bf;
  }

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
    width: 100%;
    margin: 12px 0;
  }

  th, td {
    border: 1px solid #3e4451;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background: #2c313a;
    font-weight: 600;
  }

  tr:nth-child(even) {
    background: #2c313a44;
  }

  /* ── Horizontal Rule ── */
  hr {
    border: none;
    border-top: 1px solid #3e4451;
    margin: 24px 0;
  }

  /* ── Image ── */
  img {
    max-width: 100%;
    border-radius: 6px;
    margin: 8px 0;
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
    background: #61AFEF22;
    color: #61AFEF;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .floating-toolbar button:hover {
    background: #61AFEF44;
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
  body.vscode-light h1 { color: #1a1a1a; border-bottom-color: #1a1a1a22; }
  body.vscode-light h2 { color: #2c3e50; border-bottom-color: #2c3e5022; }
  body.vscode-light h3 { color: #3a536b; }
  body.vscode-light h4 { color: #555; }
  body.vscode-light h5, body.vscode-light h6 { color: #666; }

  body.vscode-light .toc-h1 { color: #1a1a1a; }
  body.vscode-light .toc-h2 { color: #2c3e50; }
  body.vscode-light .toc-h3 { color: #3a536b; }

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
    border-color: #d0d7de;
    color: #24292f;
  }

  body.vscode-light th {
    background: #f0f2f5;
    color: #1a1a1a;
  }

  body.vscode-light tr:nth-child(even) {
    background: #f6f8fa;
  }

  body.vscode-light blockquote {
    color: #555;
    border-left-color: #2c3e50;
    background: #f6f8fa;
  }

  body.vscode-light hr { border-top-color: #d0d7de; }

  body.vscode-light a { color: #0969da; }
  body.vscode-light .toc-item { color: #333; }

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
    border: 2px solid #61AFEF;
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
    background: #61AFEF;
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
  }
</style>
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
      <div class="toc-items">
        ${tocHtml}
      </div>
    </nav>
    <main class="content">
      ${renderedHtml}
    </main>
    <textarea class="edit-textarea" id="editTextarea" spellcheck="false"></textarea>
  </div>

  <script id="heading-data" type="application/json">${headingData}</script>
  <script id="raw-markdown" type="application/json">${JSON.stringify(markdown)}</script>

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

  <script>
    const vscode = acquireVsCodeApi();

    // ── TOC toggle ──
    const toc = document.getElementById('toc');
    const tocToggle = document.getElementById('tocToggle');
    tocToggle.addEventListener('click', () => {
      toc.classList.toggle('collapsed');
      const isCollapsed = toc.classList.contains('collapsed');
      tocToggle.textContent = isCollapsed ? '▶' : '◀';
      tocToggle.title = isCollapsed ? 'TOC 열기' : 'TOC 접기';
    });

    // ── Font size control ──
    const savedState = vscode.getState() || { fontSize: 12 };
    let fontSize = savedState.fontSize;
    document.body.style.fontSize = fontSize + 'px';
    document.getElementById('fontSizeLabel').textContent = fontSize + 'px';

    document.getElementById('fontMinus').addEventListener('click', () => {
      fontSize = Math.max(10, fontSize - 1);
      document.body.style.fontSize = fontSize + 'px';
      document.getElementById('fontSizeLabel').textContent = fontSize + 'px';
      vscode.setState({ fontSize });
    });

    document.getElementById('fontPlus').addEventListener('click', () => {
      fontSize = Math.min(20, fontSize + 1);
      document.body.style.fontSize = fontSize + 'px';
      document.getElementById('fontSizeLabel').textContent = fontSize + 'px';
      vscode.setState({ fontSize });
    });

    // ── Floating toolbar ──
    const toolbar = document.getElementById('toolbar');
    const askClaudeBtn = document.getElementById('askClaudeBtn');

    document.addEventListener('mouseup', (e) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        toolbar.classList.add('visible');
        toolbar.style.left = rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2) + 'px';
        toolbar.style.top = (rect.top - toolbar.offsetHeight - 8) + 'px';

        const toolbarRect = toolbar.getBoundingClientRect();
        if (toolbarRect.left < 8) toolbar.style.left = '8px';
        if (toolbarRect.top < 8) toolbar.style.top = (rect.bottom + 8) + 'px';
      } else {
        toolbar.classList.remove('visible');
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (!toolbar.contains(e.target)) {
        toolbar.classList.remove('visible');
      }
    });

    askClaudeBtn.addEventListener('click', () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();
      if (selectedText) {
        vscode.postMessage({ type: 'askClaude', text: selectedText });
        toolbar.classList.remove('visible');
      }
    });

    // ── Active tracking ──
    function setActiveTocItem(id) {
      document.querySelectorAll('.toc-item').forEach(l => l.classList.remove('active'));
      const link = document.querySelector('.toc-item[href="#' + id + '"]');
      if (link) link.classList.add('active');
    }

    // ── Scroll sync ──
    const headingData = JSON.parse(document.getElementById('heading-data').textContent);
    let presentationActive = false;

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'syncScroll') {
        if (presentationActive) return;
        const line = message.line;
        let targetId = null;
        for (let i = headingData.length - 1; i >= 0; i--) {
          if (headingData[i].line <= line) {
            targetId = headingData[i].id;
            break;
          }
        }
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });

    // ── TOC click ──
    document.querySelectorAll('.toc-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setActiveTocItem(id);
      });
    });

    // ── Scroll-based active section ──
    const content = document.querySelector('.content');
    const headingEls = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

    content.addEventListener('scroll', () => {
      let current = '';
      headingEls.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 80) {
          current = heading.id;
        }
      });
      setActiveTocItem(current);
    });

    // ── Syntax highlighting ──
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });

    // ══════════════════════════════════════════
    // ── INLINE EDIT (double-click) ──
    // ══════════════════════════════════════════
    let inlineEditing = false;

    document.querySelector('.content').addEventListener('dblclick', (e) => {
      if (inlineEditing || presentationActive) return;

      // Find the nearest block element with line data
      let target = e.target;
      while (target && target !== document.body) {
        if (target.dataset && target.dataset.lineStart !== undefined) break;
        target = target.parentElement;
      }
      if (!target || target === document.body) return;

      const lineStart = parseInt(target.dataset.lineStart);
      const lineEnd = parseInt(target.dataset.lineEnd);
      const rawMarkdown = JSON.parse(document.getElementById('raw-markdown').textContent);
      const sourceLines = rawMarkdown.split('\\n').slice(lineStart, lineEnd);
      const sourceText = sourceLines.join('\\n');

      inlineEditing = true;
      vscode.postMessage({ type: 'editModeChanged', active: true });

      // Create inline editor
      const editorEl = document.createElement('div');
      editorEl.className = 'inline-editor';

      const ta = document.createElement('textarea');
      ta.className = 'inline-edit-textarea';
      ta.value = sourceText;
      ta.spellcheck = false;

      const bar = document.createElement('div');
      bar.className = 'inline-edit-toolbar';
      bar.innerHTML = '<span class="inline-edit-hint">Ctrl+Enter Save \\u00B7 Esc Cancel</span><button class="inline-edit-save">Save</button><button class="inline-edit-cancel">Cancel</button>';

      editorEl.appendChild(ta);
      editorEl.appendChild(bar);

      target.style.display = 'none';
      target.after(editorEl);
      ta.focus();

      // Auto-resize
      ta.style.height = Math.max(ta.scrollHeight, 60) + 'px';
      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      });

      function save() {
        vscode.postMessage({ type: 'inlineEditSave', lineStart, lineEnd, text: ta.value });
        inlineEditing = false;
        vscode.postMessage({ type: 'editModeChanged', active: false });
        editorEl.remove();
      }

      function cancel() {
        target.style.display = '';
        editorEl.remove();
        inlineEditing = false;
        vscode.postMessage({ type: 'editModeChanged', active: false });
      }

      bar.querySelector('.inline-edit-save').addEventListener('click', save);
      bar.querySelector('.inline-edit-cancel').addEventListener('click', cancel);

      ta.addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); save(); }
        if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
        if (ev.key === 'Tab') {
          ev.preventDefault();
          const s = ta.selectionStart, end = ta.selectionEnd;
          ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
          ta.selectionStart = ta.selectionEnd = s + 2;
        }
      });
    });

    // ══════════════════════════════════════════
    // ── EDIT MODE (full) ──
    // ══════════════════════════════════════════
    const editBtn = document.getElementById('editBtn');
    const editTextarea = document.getElementById('editTextarea');
    let editMode = false;

    function enterEditMode() {
      if (presentationActive) return;
      const rawMarkdown = JSON.parse(document.getElementById('raw-markdown').textContent);
      editTextarea.value = rawMarkdown;
      editMode = true;
      document.body.classList.add('edit-mode');
      editBtn.style.color = '#61AFEF';
      editTextarea.focus();
      vscode.postMessage({ type: 'editModeChanged', active: true });
    }

    function exitEditMode() {
      editMode = false;
      document.body.classList.remove('edit-mode');
      editBtn.style.color = '';
      vscode.postMessage({ type: 'editModeChanged', active: false });
    }

    function saveEdit() {
      vscode.postMessage({ type: 'editSave', text: editTextarea.value });
      exitEditMode();
    }

    editBtn.addEventListener('click', () => {
      if (editMode) {
        const hasChanges = editTextarea.value !== JSON.parse(document.getElementById('raw-markdown').textContent);
        if (hasChanges) {
          if (confirm('Discard unsaved changes?')) {
            exitEditMode();
          }
        } else {
          exitEditMode();
        }
      } else {
        enterEditMode();
      }
    });

    editTextarea.addEventListener('keydown', (e) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveEdit();
      }
      // Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        const hasChanges = editTextarea.value !== JSON.parse(document.getElementById('raw-markdown').textContent);
        if (hasChanges) {
          if (confirm('Discard unsaved changes?')) {
            exitEditMode();
          }
        } else {
          exitEditMode();
        }
      }
      // Tab to indent
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editTextarea.selectionStart;
        const end = editTextarea.selectionEnd;
        editTextarea.value = editTextarea.value.substring(0, start) + '  ' + editTextarea.value.substring(end);
        editTextarea.selectionStart = editTextarea.selectionEnd = start + 2;
      }
    });

    // ══════════════════════════════════════════
    // ── PRESENTATION MODE ──
    // ══════════════════════════════════════════
    function buildSlides() {
      const contentEl = document.querySelector('.content');
      const children = Array.from(contentEl.childNodes);
      const groups = [];
      let cur = [];

      children.forEach(node => {
        if (node.nodeName === 'HR') {
          groups.push(cur);
          cur = [];
          node.classList.add('slide-divider');
        } else {
          cur.push(node);
        }
      });
      if (cur.length > 0) groups.push(cur);

      groups.forEach((group, i) => {
        const div = document.createElement('div');
        div.className = 'slide';
        div.dataset.slideIndex = i;
        if (group.length > 0) {
          contentEl.insertBefore(div, group[0]);
          group.forEach(n => div.appendChild(n));
        }
      });

      contentEl.querySelectorAll('.slide-divider').forEach(hr => hr.remove());
      return groups.length;
    }

    const totalSlides = buildSlides();
    let currentSlide = 0;
    const allSlides = document.querySelectorAll('.slide');
    const slideCounter = document.getElementById('slideCounter');
    const presentBtn = document.getElementById('presentBtn');

    function updateSlideClasses() {
      allSlides.forEach((s, i) => {
        s.classList.remove('slide-active', 'slide-prev');
        if (i === currentSlide) s.classList.add('slide-active');
        else if (i < currentSlide) s.classList.add('slide-prev');
      });
      slideCounter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
    }

    function enterPresentation() {
      if (totalSlides <= 1 || editMode) return;
      presentationActive = true;
      currentSlide = 0;
      document.body.classList.add('presentation-mode');
      updateSlideClasses();
      try { mermaid.init(undefined, '.slide-active .mermaid'); } catch(e) {}
    }

    function exitPresentation() {
      presentationActive = false;
      document.body.classList.remove('presentation-mode');
      allSlides.forEach(s => s.classList.remove('slide-active', 'slide-prev'));
    }

    function goToSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      currentSlide = index;
      updateSlideClasses();
      try { mermaid.init(undefined, '.slide-active .mermaid'); } catch(e) {}
    }

    presentBtn.addEventListener('click', () => {
      presentationActive ? exitPresentation() : enterPresentation();
    });

    document.getElementById('slidePrev').addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('slideNext').addEventListener('click', () => goToSlide(currentSlide + 1));
    document.getElementById('slideExit').addEventListener('click', exitPresentation);

    document.addEventListener('keydown', (e) => {
      if (!presentationActive) return;
      switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ':
          e.preventDefault(); goToSlide(currentSlide + 1); break;
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault(); goToSlide(currentSlide - 1); break;
        case 'Escape': exitPresentation(); break;
        case 'Home': e.preventDefault(); goToSlide(0); break;
        case 'End': e.preventDefault(); goToSlide(totalSlides - 1); break;
      }
    });

    // Hide present button if no slides
    if (totalSlides <= 1) presentBtn.style.opacity = '0.3';

    // ══════════════════════════════════════════
    // ── PDF EXPORT ──
    // ══════════════════════════════════════════
    const pdfBtn = document.getElementById('pdfBtn');
    let pdfExporting = false;

    pdfBtn.addEventListener('click', () => {
      if (pdfExporting) return;
      pdfExporting = true;
      pdfBtn.textContent = '...';
      pdfBtn.style.opacity = '0.5';
      vscode.postMessage({ type: 'exportPdf' });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'pdfStatus') {
        pdfExporting = false;
        pdfBtn.textContent = 'PDF';
        pdfBtn.style.opacity = '1';
      }
    });
  </script>
</body>
</html>`;
}

function findChrome(): string | null {
  const candidates: string[] =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : process.platform === 'win32'
        ? [
            path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          ]
        : ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) { return p; }
    } catch {
      // skip
    }
  }
  return null;
}

function getPdfHtml(markdown: string): string {
  const { text: stripped, offset: fmOffset } = stripFrontmatter(markdown);
  const { processed, blocks } = preprocessMermaid(stripped);
  const headings = extractHeadings(stripped);
  let renderedHtml = md.render(processed, { fmOffset });
  renderedHtml = addHeadingIds(renderedHtml, headings);
  blocks.forEach((content, idx) => {
    renderedHtml = renderedHtml.replace(
      new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
      `<div class="mermaid">${content}</div>`
    );
  });

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
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

  h1 { font-size: 2.33em; font-weight: 700; color: #61AFEF; margin: 32px 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #61AFEF44; }
  h2 { font-size: 1.83em; font-weight: 600; color: #98C379; margin: 28px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #98C37944; page-break-after: avoid; }
  h3 { font-size: 1.5em; font-weight: 600; color: #E5C07B; margin: 24px 0 10px 0; page-break-after: avoid; }
  h4 { font-size: 1.25em; font-weight: 600; color: #C678DD; margin: 20px 0 8px 0; }
  h5, h6 { font-size: 1.08em; font-weight: 600; color: #ABB2BF; margin: 16px 0 8px 0; }
  h1:first-child { margin-top: 0; }

  p { margin: 10px 0; }
  a { color: #61AFEF; text-decoration: none; }
  strong { font-weight: 700; }
  em { font-style: italic; }

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

  blockquote { border-left: 4px solid #61AFEF; margin: 12px 0; padding: 8px 16px; background: #61AFEF0a; color: #abb2bf; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }

  table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; }
  th, td { border: 1px solid #3e4451; padding: 8px 12px; text-align: left; }
  th { background: #2c313a; font-weight: 600; }
  tr:nth-child(even) { background: #2c313a44; }

  hr { border: none; border-top: 1px solid #3e4451; margin: 24px 0; }
  img { max-width: 100%; border-radius: 6px; margin: 8px 0; page-break-inside: avoid; }
  input[type="checkbox"] { margin-right: 6px; }

  .mermaid { page-break-inside: avoid; margin: 16px 0; }
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

function exportToPdf(markdown: string, mdFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chrome = findChrome();
    if (!chrome) {
      reject(new Error(
        'Chrome/Chromium/Edge not found. Please install Google Chrome to export PDF.'
      ));
      return;
    }

    const html = getPdfHtml(markdown);
    const tmpHtml = path.join(os.tmpdir(), `md-pdf-${Date.now()}.html`);
    fs.writeFileSync(tmpHtml, html, 'utf-8');

    const parsed = path.parse(mdFilePath);
    const pdfPath = path.join(parsed.dir, `${parsed.name}.pdf`);

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-software-rasterizer',
      `--print-to-pdf=${pdfPath}`,
      '--print-to-pdf-no-header',
      '--virtual-time-budget=5000',
      `file://${tmpHtml}`,
    ];

    execFile(chrome, args, { timeout: 30000 }, (error) => {
      try { fs.unlinkSync(tmpHtml); } catch {}
      if (error) {
        reject(error);
      } else {
        resolve(pdfPath);
      }
    });
  });
}

export function deactivate() {}
