import * as vscode from 'vscode';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

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
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const updateWebview = () => {
      const text = editor.document.getText();
      panel.webview.html = getWebviewContent(text);
    };

    updateWebview();

    // Receive messages from Webview
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'askClaude') {
        const selectedText = message.text;
        const prompt = `Please improve the following markdown:\n\n${selectedText}`;

        // Send to Claude Code terminal
        sendToClaudeTerminal(prompt);
      }
    });

    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === editor.document) {
        updateWebview();
      }
    });

    const switchDisposable = vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.languageId === 'markdown') {
        panel.title = `Preview: ${getFileName(e.document.uri)}`;
        panel.webview.html = getWebviewContent(e.document.getText());
      }
    });

    panel.onDidDispose(() => {
      changeDisposable.dispose();
      switchDisposable.dispose();
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
}

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const idCount: Record<string, number> = {};
  const lines = markdown.split('\n');

  for (const line of lines) {
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

      headings.push({ level, text, id });
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
    const tagRegex = new RegExp(`<h${h.level}>`, '');
    result = result.replace(tagRegex, `<h${h.level} id="${h.id}">`);
  }
  return result;
}

function stripFrontmatter(markdown: string): string {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (match) {
    return markdown.slice(match[0].length);
  }
  return markdown;
}

function getWebviewContent(markdown: string): string {
  const stripped = stripFrontmatter(markdown);
  const headings = extractHeadings(stripped);
  let renderedHtml = md.render(stripped);
  renderedHtml = addHeadingIds(renderedHtml, headings);
  const tocHtml = generateTocHtml(headings);

  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    padding: 16px 12px;
    border-right: 1px solid var(--vscode-panel-border, #333);
    background: var(--vscode-sideBar-background, #181818);
    position: sticky;
    top: 0;
  }

  .toc-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-sideBarSectionHeader-foreground, #999);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border, #333);
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
    font-size: 28px;
    font-weight: 700;
    color: #61AFEF;
    margin: 32px 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 2px solid #61AFEF44;
  }

  h2 {
    font-size: 22px;
    font-weight: 600;
    color: #98C379;
    margin: 28px 0 12px 0;
    padding-bottom: 6px;
    border-bottom: 1px solid #98C37944;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #E5C07B;
    margin: 24px 0 10px 0;
  }

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #C678DD;
    margin: 20px 0 8px 0;
  }

  h5, h6 {
    font-size: 13px;
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
    background: #2c313a;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11.5px;
  }

  pre {
    background: #282c34;
    border: 1px solid #3e4451;
    border-radius: 6px;
    padding: 16px;
    margin: 12px 0;
    overflow-x: auto;
  }

  pre code {
    background: none;
    padding: 0;
    font-size: 12px;
    line-height: 1.6;
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
</style>
</head>
<body>
  <div class="container">
    <nav class="toc">
      <div class="toc-title">Table of Contents</div>
      ${tocHtml}
    </nav>
    <main class="content">
      ${renderedHtml}
    </main>
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
    const toolbar = document.getElementById('toolbar');
    const askClaudeBtn = document.getElementById('askClaudeBtn');

    // Show floating toolbar on text selection
    document.addEventListener('mouseup', (e) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        toolbar.classList.add('visible');
        toolbar.style.left = rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2) + 'px';
        toolbar.style.top = (rect.top - toolbar.offsetHeight - 8) + 'px';

        // Adjust if toolbar goes off-screen
        const toolbarRect = toolbar.getBoundingClientRect();
        if (toolbarRect.left < 8) toolbar.style.left = '8px';
        if (toolbarRect.top < 8) toolbar.style.top = (rect.bottom + 8) + 'px';
      } else {
        toolbar.classList.remove('visible');
      }
    });

    // Hide toolbar on click outside
    document.addEventListener('mousedown', (e) => {
      if (!toolbar.contains(e.target)) {
        toolbar.classList.remove('visible');
      }
    });

    // "Ask Claude" button click
    askClaudeBtn.addEventListener('click', () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText) {
        vscode.postMessage({
          type: 'askClaude',
          text: selectedText
        });
        toolbar.classList.remove('visible');
      }
    });

    // TOC click → smooth scroll
    document.querySelectorAll('.toc-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        document.querySelectorAll('.toc-item').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    // Highlight current section on scroll
    const content = document.querySelector('.content');
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
    const tocLinks = document.querySelectorAll('.toc-item');

    content.addEventListener('scroll', () => {
      let current = '';
      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 80) {
          current = heading.id;
        }
      });

      tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    });
  </script>
</body>
</html>`;
}

export function deactivate() {}
