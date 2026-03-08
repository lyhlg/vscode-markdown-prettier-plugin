import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import MarkdownIt from 'markdown-it';
import markdownItMark from 'markdown-it-mark';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItMark);

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

// ── GitHub-style Callout/Admonition post-processing ──
const CALLOUT_TYPES: Record<string, { label: string; icon: string }> = {
  NOTE: {
    label: 'Note',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  },
  TIP: {
    label: 'Tip',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>',
  },
  IMPORTANT: {
    label: 'Important',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  },
  WARNING: {
    label: 'Warning',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  },
  CAUTION: {
    label: 'Caution',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  },
  DANGER: {
    label: 'Danger',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  },
};

function processCallouts(html: string): string {
  const calloutTypePattern = Object.keys(CALLOUT_TYPES).join('|');
  const regex = new RegExp(
    `<blockquote[^>]*>\\s*<p[^>]*>\\[!(${calloutTypePattern})\\]\\s*<br>\\s*([\\s\\S]*?)</p>([\\s\\S]*?)</blockquote>`,
    'gi'
  );
  // Also handle single-line: [!TYPE]\ncontent in same <p>
  const regexNewline = new RegExp(
    `<blockquote[^>]*>\\s*<p[^>]*>\\[!(${calloutTypePattern})\\]\\n([\\s\\S]*?)</p>([\\s\\S]*?)</blockquote>`,
    'gi'
  );
  // Handle case where [!TYPE] is on its own <p> followed by another <p>
  const regexSeparate = new RegExp(
    `<blockquote[^>]*>\\s*<p[^>]*>\\[!(${calloutTypePattern})\\]</p>\\s*([\\s\\S]*?)</blockquote>`,
    'gi'
  );

  function replacer(_match: string, type: string, content: string, rest?: string): string {
    const key = type.toUpperCase();
    const info = CALLOUT_TYPES[key];
    if (!info) { return _match; }
    const body = (content + (rest || '')).trim();
    return `<div class="callout callout-${key.toLowerCase()}">` +
      `<div class="callout-title">${info.icon}<span>${info.label}</span></div>` +
      `<div class="callout-content">${body}</div>` +
      `</div>`;
  }

  html = html.replace(regex, (_m, type, content, rest) => replacer(_m, type, content, rest));
  html = html.replace(regexNewline, (_m, type, content, rest) => replacer(_m, type, content, rest));
  html = html.replace(regexSeparate, (_m, type, content) => replacer(_m, type, content, ''));
  return html;
}

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

    const sendContentUpdate = () => {
      const text = editor.document.getText();
      const { text: stripped, offset: fmOffset } = stripFrontmatter(text);
      const { processed, blocks } = preprocessMermaid(stripped);
      const headings = extractHeadings(stripped);
      let renderedHtml = md.render(processed, { fmOffset });
      renderedHtml = addHeadingIds(renderedHtml, headings);
      renderedHtml = processCallouts(renderedHtml);
      blocks.forEach((content, idx) => {
        renderedHtml = renderedHtml.replace(
          new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
          `<div class="mermaid">${escapeHtml(content)}</div>`
        );
      });
      const tocHtml = generateTocHtml(headings);
      const headingData = headings.map(h => ({ id: h.id, line: h.line }));
      panel.webview.postMessage({
        type: 'updateContent',
        renderedHtml,
        tocHtml,
        headingData,
        rawMarkdown: text
      });
    };

    let isEditMode = false;
    let pendingSyncLine: number | null = null;

    panel.webview.html = getWebviewContent(editor.document.getText());

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
        sendContentUpdate();
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
        sendContentUpdate();
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
      } else if (message.type === 'scrollToLine') {
        const line = message.line;
        // Check if editor is visible in any column
        const visibleEditor = vscode.window.visibleTextEditors.find(
          e => e.document === editor.document
        );
        if (visibleEditor) {
          // Side-by-side: sync immediately
          ignoreEditorScroll = true;
          const range = new vscode.Range(line, 0, line, 0);
          visibleEditor.revealRange(range, vscode.TextEditorRevealType.AtTop);
          setTimeout(() => { ignoreEditorScroll = false; }, 300);
        } else {
          // Preview is full-screen: save for later
          pendingSyncLine = line;
        }
      }
    });

    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === editor.document && !isEditMode) {
        sendContentUpdate();
      }
    });

    const switchDisposable = vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.languageId === 'markdown') {
        panel.title = `Preview: ${getFileName(e.document.uri)}`;
        panel.webview.html = getWebviewContent(e.document.getText());
      }
      // Apply pending scroll position when editor becomes active again
      if (e && e.document === editor.document && pendingSyncLine !== null) {
        const line = pendingSyncLine;
        pendingSyncLine = null;
        ignoreEditorScroll = true;
        const range = new vscode.Range(line, 0, line, 0);
        e.revealRange(range, vscode.TextEditorRevealType.AtTop);
        setTimeout(() => { ignoreEditorScroll = false; }, 300);
      }
    });

    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
    let ignoreEditorScroll = false;
    const scrollDisposable = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      if (ignoreEditorScroll) return;
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

  // ── Slash command autocomplete ──
  function mermaidImgUrl(code: string): string {
    const json = JSON.stringify({ code, mermaid: { theme: 'dark' } });
    return `https://mermaid.ink/img/${Buffer.from(json).toString('base64')}`;
  }

  // Load preview images from media/previews/ as base64 data URIs
  const previewsDir = path.join(context.extensionPath, 'media', 'previews');
  const previewImages: Record<string, string> = {};
  if (fs.existsSync(previewsDir)) {
    for (const file of fs.readdirSync(previewsDir)) {
      if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
        const name = file.replace(/\.[^.]+$/, '');
        const filePath = path.join(previewsDir, file);
        const ext = path.extname(file).slice(1).toLowerCase();
        const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
        const data = fs.readFileSync(filePath).toString('base64');
        previewImages[name] = `data:${mime};base64,${data}`;
      }
    }
  }

  function previewImg(name: string): string {
    const uri = previewImages[name];
    return uri ? `![preview](${uri})\n\n` : '';
  }

  const slashCommands: { label: string; detail: string; snippet: string; doc: string; previewKey?: string }[] = [
    {
      label: '/h1',
      detail: 'Heading 1',
      snippet: '# ${1:Heading 1}\n',
      doc: '# Heading 1\n\n렌더링 결과: 가장 큰 제목, 하단 구분선 포함',
    },
    {
      label: '/h2',
      detail: 'Heading 2',
      snippet: '## ${1:Heading 2}\n',
      doc: '## Heading 2\n\n렌더링 결과: 두번째 크기 제목, 하단 구분선 포함',
    },
    {
      label: '/h3',
      detail: 'Heading 3',
      snippet: '### ${1:Heading 3}\n',
      doc: '### Heading 3\n\n렌더링 결과: 세번째 크기 제목',
    },
    {
      label: '/codeblock',
      detail: 'Code block with language',
      snippet: '```${1|javascript,typescript,python,bash,json,html,css,dockerfile,yaml,go,rust,java,sql|}\n${2:code}\n```\n',
      previewKey: 'codeblock',
      doc: [
        '언어를 선택하면 신택스 하이라이팅이 적용됩니다.',
        '',
        '````',
        '```javascript',
        'const greeting = "Hello World";',
        'console.log(greeting);',
        '```',
        '````',
        '',
        '지원 언어: `javascript` `typescript` `python` `bash` `json` `html` `css` `dockerfile` `yaml` `go` `rust` `java` `sql`',
      ].join('\n'),
    },
    {
      label: '/table',
      detail: 'Table',
      snippet: '| ${1:Header 1} | ${2:Header 2} | ${3:Header 3} |\n|---|---|---|\n| ${4:Cell 1} | ${5:Cell 2} | ${6:Cell 3} |\n',
      previewKey: 'table',
      doc: [
        '```',
        '| Name   | Role     | Team   |',
        '|--------|----------|--------|',
        '| Alice  | Engineer | FE     |',
        '| Bob    | Designer | Design |',
        '```',
      ].join('\n'),
    },
    {
      label: '/mermaid',
      detail: 'Mermaid diagram (유형 선택)',
      snippet: '```mermaid\n${1|flowchart TD,sequenceDiagram,classDiagram,stateDiagram-v2,erDiagram,gantt,pie,gitgraph|}\n    ${2:A --> B}\n```\n',
      previewKey: 'mermaid',
      doc: [
        '지원 유형:',
        '- `flowchart TD` — 플로우차트',
        '- `sequenceDiagram` — 시퀀스 다이어그램',
        '- `classDiagram` — 클래스 다이어그램',
        '- `stateDiagram-v2` — 상태 다이어그램',
        '- `erDiagram` — ER 다이어그램',
        '- `gantt` — 간트 차트',
        '- `pie` — 파이 차트',
        '- `gitgraph` — Git 그래프',
      ].join('\n'),
    },
    {
      label: '/mermaid-flowchart',
      detail: 'Mermaid flowchart',
      snippet: '```mermaid\nflowchart TD\n    ${1:A}[${2:Start}] --> ${3:B}[${4:End}]\n```\n',
      previewKey: 'mermaid-flowchart',
      doc: [
        '````',
        '```mermaid',
        'flowchart TD',
        '    A[Start] --> B{Decision}',
        '    B -->|Yes| C[OK]',
        '    B -->|No| D[Cancel]',
        '```',
        '````',
        '',
        '노드 모양: `[사각형]` `{마름모}` `([둥근])` `((원형))`',
        '',
        '방향: `TD` 위→아래 · `LR` 왼→오른',
      ].join('\n'),
    },
    {
      label: '/mermaid-sequence',
      detail: 'Mermaid sequence diagram',
      snippet: '```mermaid\nsequenceDiagram\n    ${1:Alice}->>+${2:Bob}: ${3:Hello}\n    ${2:Bob}-->>-${1:Alice}: ${4:Hi}\n```\n',
      previewKey: 'mermaid-sequence',
      doc: [
        '````',
        '```mermaid',
        'sequenceDiagram',
        '    Alice->>+Bob: Request',
        '    Bob-->>-Alice: Response',
        '```',
        '````',
        '',
        '화살표: `->>` 실선 · `-->>` 점선 · `+`/`-` 활성화',
      ].join('\n'),
    },
    {
      label: '/mermaid-class',
      detail: 'Mermaid class diagram',
      snippet: '```mermaid\nclassDiagram\n    class ${1:ClassName} {\n        +${2:method}() ${3:void}\n    }\n```\n',
      previewKey: 'mermaid-class',
      doc: [
        '````',
        '```mermaid',
        'classDiagram',
        '    class Animal {',
        '        +String name',
        '        +move() void',
        '    }',
        '    Animal <|-- Dog : extends',
        '```',
        '````',
        '',
        '접근자: `+` public · `-` private · `#` protected',
        '',
        '관계: `<|--` 상속 · `*--` 합성 · `o--` 집약',
      ].join('\n'),
    },
    {
      label: '/note',
      detail: 'Callout — Note',
      snippet: '> [!NOTE]\n> ${1:Useful information}\n',
      previewKey: 'note',
      doc: [
        '```',
        '> [!NOTE]',
        '> Useful information that users',
        '> should know.',
        '```',
      ].join('\n'),
    },
    {
      label: '/tip',
      detail: 'Callout — Tip',
      snippet: '> [!TIP]\n> ${1:Helpful advice}\n',
      previewKey: 'tip',
      doc: [
        '```',
        '> [!TIP]',
        '> Helpful advice for doing things',
        '> better or more easily.',
        '```',
      ].join('\n'),
    },
    {
      label: '/important',
      detail: 'Callout — Important',
      snippet: '> [!IMPORTANT]\n> ${1:Key information}\n',
      previewKey: 'important',
      doc: [
        '```',
        '> [!IMPORTANT]',
        '> Key information users need to know.',
        '```',
      ].join('\n'),
    },
    {
      label: '/warning',
      detail: 'Callout — Warning',
      snippet: '> [!WARNING]\n> ${1:Potential issue}\n',
      previewKey: 'warning',
      doc: [
        '```',
        '> [!WARNING]',
        '> Urgent info that needs immediate',
        '> user attention to avoid problems.',
        '```',
      ].join('\n'),
    },
    {
      label: '/caution',
      detail: 'Callout — Caution',
      snippet: '> [!CAUTION]\n> ${1:Critical warning}\n',
      previewKey: 'caution',
      doc: [
        '```',
        '> [!CAUTION]',
        '> Advises about risks or negative outcomes.',
        '```',
      ].join('\n'),
    },
    {
      label: '/image',
      detail: 'Image',
      snippet: '![${1:alt text}](${2:url})\n',
      doc: [
        '```',
        '![Screenshot](./images/screenshot.png)',
        '```',
        '',
        '로컬 파일 경로 또는 URL을 사용할 수 있습니다.',
      ].join('\n'),
    },
    {
      label: '/link',
      detail: 'Link',
      snippet: '[${1:text}](${2:url})',
      doc: [
        '```',
        '[GitHub](https://github.com)',
        '```',
        '',
        '렌더링 결과: [GitHub](https://github.com)',
      ].join('\n'),
    },
    {
      label: '/checkbox',
      detail: 'Task list',
      snippet: '- [ ] ${1:Task 1}\n- [ ] ${2:Task 2}\n- [ ] ${3:Task 3}\n',
      previewKey: 'checkbox',
      doc: [
        '```',
        '- [x] Completed task',
        '- [ ] Pending task',
        '- [ ] Another task',
        '```',
      ].join('\n'),
    },
    {
      label: '/blockquote',
      detail: 'Blockquote',
      snippet: '> ${1:Quote text}\n',
      doc: [
        '```',
        '> "The best way to predict the future',
        '> is to invent it." — Alan Kay',
        '```',
        '',
        '> "The best way to predict the future is to invent it." — Alan Kay',
      ].join('\n'),
    },
    {
      label: '/hr',
      detail: 'Horizontal rule (slide divider)',
      snippet: '\n---\n\n',
      doc: [
        '```',
        '---',
        '```',
        '',
        '수평선을 삽입합니다.',
        '',
        '**Presentation Mode**에서 `---`는 슬라이드 구분선으로 사용됩니다.',
      ].join('\n'),
    },
    {
      label: '/bold',
      detail: 'Bold text',
      snippet: '**${1:text}**',
      doc: '`**bold text**` → **bold text**',
    },
    {
      label: '/italic',
      detail: 'Italic text',
      snippet: '*${1:text}*',
      doc: '`*italic text*` → *italic text*',
    },
    {
      label: '/highlight',
      detail: 'Highlighted text (==mark==)',
      snippet: '==${1:text}==',
      doc: [
        '`==highlighted text==`',
        '',
        '형광펜으로 강조한 것처럼 배경색이 적용됩니다.',
        '',
        '`markdown-it-mark` 플러그인 기반',
      ].join('\n'),
    },
    {
      label: '/strikethrough',
      detail: 'Strikethrough text',
      snippet: '~~${1:text}~~',
      doc: '`~~strikethrough~~` → ~~strikethrough~~',
    },
  ];

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text;
        const linePrefix = lineText.substring(0, position.character);

        // Find the `/` trigger position
        const slashIdx = linePrefix.lastIndexOf('/');
        if (slashIdx === -1) { return []; }

        // Only trigger if `/` is at line start or preceded by whitespace
        if (slashIdx > 0 && linePrefix[slashIdx - 1] !== ' ' && linePrefix[slashIdx - 1] !== '\t') {
          return [];
        }

        const typed = linePrefix.substring(slashIdx);
        const replaceRange = new vscode.Range(position.line, slashIdx, position.line, position.character);

        return slashCommands
          .filter(cmd => cmd.label.startsWith(typed))
          .map((cmd, i) => {
            const item = new vscode.CompletionItem(cmd.label, vscode.CompletionItemKind.Snippet);
            item.detail = cmd.detail;
            item.insertText = new vscode.SnippetString(cmd.snippet);
            item.range = replaceRange;
            item.sortText = String(i).padStart(3, '0');
            // Build documentation: preview image (if exists) + text doc
            let docContent = '';
            if (cmd.previewKey && previewImages[cmd.previewKey]) {
              docContent += previewImg(cmd.previewKey);
            } else if (cmd.previewKey?.startsWith('mermaid')) {
              // Fallback to mermaid.ink for mermaid commands without local preview
              const mermaidExamples: Record<string, string> = {
                'mermaid': 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]',
                'mermaid-flowchart': 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]',
                'mermaid-sequence': 'sequenceDiagram\n    Alice->>+Bob: Request\n    Bob-->>-Alice: Response\n    Alice->>+Server: API Call\n    Server-->>-Alice: Data',
                'mermaid-class': 'classDiagram\n    class Animal {\n        +String name\n        +move() void\n    }\n    class Dog {\n        +bark() void\n    }\n    Animal <|-- Dog : extends',
              };
              const code = mermaidExamples[cmd.previewKey];
              if (code) {
                docContent += `![preview](${mermaidImgUrl(code)})\n\n`;
              }
            }
            docContent += cmd.doc;

            const docs = new vscode.MarkdownString(docContent);
            docs.isTrusted = true;
            docs.supportHtml = true;
            item.documentation = docs;
            return item;
          });
      },
    },
    '/',
  );

  context.subscriptions.push(disposable, completionProvider);
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
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(`{3,}|~{3,})/.test(line.trimStart())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) { continue; }

    let level: number | null = null;
    let text: string | null = null;
    let headingLine = i;

    // ATX-style: # heading
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      level = match[1].length;
      text = match[2].replace(/[#*_`\[\]]/g, '').trim();
    }

    // Setext-style: text followed by === (H1) or --- (H2)
    if (!match && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (/^={2,}\s*$/.test(nextLine) && line.trim().length > 0) {
        level = 1;
        text = line.replace(/[#*_`\[\]]/g, '').trim();
      } else if (/^-{2,}\s*$/.test(nextLine) && line.trim().length > 0) {
        level = 2;
        text = line.replace(/[#*_`\[\]]/g, '').trim();
      }
    }

    if (level !== null && text) {
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

      headings.push({ level, text, id, line: headingLine });
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
      const depth = h.level - 1;
      const indent = 12 + depth * 10;
      const guides = Array.from({ length: depth }, (_, i) =>
        `<span class="toc-guide" style="left: ${12 + i * 10}px"></span>`
      ).join('');
      return `<a class="toc-item toc-h${h.level}" href="#${h.id}" data-level="${h.level}" data-text="${h.text.replace(/"/g, '&quot;')}" style="padding-left: ${indent}px">${guides}${h.text}</a>`;
    })
    .join('\n');
}

function addHeadingIds(html: string, headings: Heading[]): string {
  let result = html;
  for (const h of headings) {
    // Match only <hN> tags that do NOT already have an id attribute
    const tagRegex = new RegExp(`<h${h.level}(?![^>]*\\bid=)([ >])`, '');
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

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  renderedHtml = processCallouts(renderedHtml);
  // Replace placeholders with mermaid divs after markdown-it rendering
  blocks.forEach((content, idx) => {
    renderedHtml = renderedHtml.replace(
      new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
      `<div class="mermaid">${escapeHtml(content)}</div>`
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
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/dockerfile.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
<script>
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
  });
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
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid;
    border-radius: 6px;
  }
  .callout-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
  }
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

  /* ── Mermaid Diagram Overrides ── */
  .mermaid {
    margin: 20px 0;
    padding: 16px;
    background: rgba(255,255,255,0.03);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    text-align: center;
  }
  .mermaid svg { max-width: 100% !important; height: auto !important; }

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

    // ── TOC resize drag ──
    const resizeHandle = document.getElementById('tocResizeHandle');
    let isResizing = false;
    resizeHandle.addEventListener('mousedown', (e) => {
      if (toc.classList.contains('collapsed')) return;
      isResizing = true;
      resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(120, Math.min(e.clientX, 500));
      toc.style.width = newWidth + 'px';
      toc.style.transition = 'none';
    });
    document.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      resizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      toc.style.transition = '';
    });

    // ── TOC search ──
    const tocSearch = document.getElementById('tocSearch');
    let tocItemsArr = Array.from(document.querySelectorAll('.toc-item'));

    // Pre-compute: read data attributes once
    let tocData = tocItemsArr.map(item => ({
      level: parseInt(item.getAttribute('data-level') || '99'),
      text: item.getAttribute('data-text') || '',
      origHtml: item.innerHTML
    }));

    // Pre-compute parent index for each item
    let tocParentIdx = tocData.map((_, i) => {
      for (let j = i - 1; j >= 0; j--) {
        if (tocData[j].level < tocData[i].level) return j;
      }
      return -1;
    });

    tocSearch.addEventListener('input', () => {
      const query = tocSearch.value.trim().toLowerCase();

      if (!query) {
        tocItemsArr.forEach((item, i) => {
          item.style.display = '';
          item.style.opacity = '';
          item.innerHTML = tocData[i].origHtml;
        });
        return;
      }

      // First pass: direct match check
      const matched = tocData.map(d => d.text.toLowerCase().includes(query));

      // Ancestor match check
      function hasMatchedAncestor(i) {
        var p = tocParentIdx[i];
        while (p !== -1) {
          if (matched[p]) return true;
          p = tocParentIdx[p];
        }
        return false;
      }

      // Second pass: show/hide
      tocItemsArr.forEach((item, i) => {
        var text = tocData[i].text;

        if (matched[i]) {
          // Direct match: show with highlight
          var lower = text.toLowerCase();
          var idx = lower.indexOf(query);
          var highlighted = text.substring(0, idx) + '<span class="toc-highlight">' + text.substring(idx, idx + query.length) + '</span>' + text.substring(idx + query.length);
          item.innerHTML = highlighted;
          item.style.display = '';
          item.style.opacity = '';
        } else if (hasMatchedAncestor(i)) {
          // Child of match: show dimmed
          item.innerHTML = text;
          item.style.display = '';
          item.style.opacity = '0.45';
        } else {
          // No match: hide
          item.innerHTML = text;
          item.style.display = 'none';
          item.style.opacity = '';
        }
      });
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
    let headingData = JSON.parse(document.getElementById('heading-data').textContent);
    let presentationActive = false;
    let scrollSource = null; // 'editor' or 'preview' — prevents infinite loop
    let scrollSourceTimer = null;

    function setScrollSource(source) {
      scrollSource = source;
      if (scrollSourceTimer) clearTimeout(scrollSourceTimer);
      scrollSourceTimer = setTimeout(() => { scrollSource = null; }, 300);
    }

    // Editor → Preview
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'syncScroll') {
        if (presentationActive || scrollSource === 'preview') return;
        setScrollSource('editor');
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
      } else if (message.type === 'updateContent') {
        const contentEl = document.querySelector('.content');
        const savedScrollTop = contentEl.scrollTop;

        // Exit presentation mode if active
        if (presentationActive) exitPresentation();

        // Reset inline editing state
        inlineEditing = false;

        // Update content HTML
        contentEl.innerHTML = message.renderedHtml;

        // Update TOC items
        document.querySelector('.toc-items').innerHTML = message.tocHtml;

        // Update data elements
        document.getElementById('heading-data').textContent = JSON.stringify(message.headingData);
        document.getElementById('raw-markdown').textContent = JSON.stringify(message.rawMarkdown);

        // Update JS references
        headingData = message.headingData;
        headingEls = contentEl.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

        // Re-run syntax highlighting
        contentEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));

        // Re-add code copy buttons
        contentEl.querySelectorAll('pre').forEach(pre => {
          const code = pre.querySelector('code');
          if (!code) return;
          const btn = document.createElement('button');
          btn.className = 'code-copy-btn';
          btn.textContent = 'Copy';
          btn.addEventListener('click', () => {
            navigator.clipboard.writeText(code.textContent || '').then(() => {
              btn.textContent = 'Copied!';
              btn.classList.add('copied');
              setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
          });
          pre.appendChild(btn);
        });

        // Rebuild slides for presentation mode (must happen before mermaid init)
        totalSlides = buildSlides();
        allSlides = document.querySelectorAll('.slide');
        if (totalSlides <= 1) presentBtn.style.opacity = '0.3';
        else presentBtn.style.opacity = '';

        // Re-initialize mermaid diagrams (after slides are built so DOM is stable)
        const mermaidDivs = contentEl.querySelectorAll('.mermaid');
        if (mermaidDivs.length > 0) {
          const nodes = Array.from(mermaidDivs);
          // Remove any stale processed state so mermaid re-renders them
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') {
            mermaid.run({ nodes }).catch(() => {});
          } else {
            try { mermaid.init(undefined, nodes); } catch(e) {}
          }
          setTimeout(fixMermaidDiagrams, 500);
          setTimeout(fixMermaidDiagrams, 1500);
        }

        // Re-build TOC data for search
        tocItemsArr = Array.from(document.querySelectorAll('.toc-item'));
        tocData = tocItemsArr.map(item => ({
          level: parseInt(item.getAttribute('data-level') || '99'),
          text: item.getAttribute('data-text') || '',
          origHtml: item.innerHTML
        }));
        tocParentIdx = tocData.map((_, i) => {
          for (let j = i - 1; j >= 0; j--) {
            if (tocData[j].level < tocData[i].level) return j;
          }
          return -1;
        });

        // Re-attach TOC click handlers
        tocItemsArr.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            const tgt = document.getElementById(id);
            if (tgt) {
              setScrollSource('preview');
              tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setActiveTocItem(id);
            const heading = headingData.find(h => h.id === id);
            if (heading) {
              vscode.postMessage({ type: 'scrollToLine', line: heading.line });
            }
          });
        });

        // Re-apply TOC search if active
        if (tocSearch.value.trim()) {
          tocSearch.dispatchEvent(new Event('input'));
        }

        // Restore scroll position (disable smooth scroll temporarily)
        contentEl.style.scrollBehavior = 'auto';
        contentEl.scrollTop = savedScrollTop;
        requestAnimationFrame(() => { contentEl.style.scrollBehavior = ''; });
      }
    });

    // ── TOC click ──
    document.querySelectorAll('.toc-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          setScrollSource('preview');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setActiveTocItem(id);
        // Send exact heading line to editor
        const heading = headingData.find(h => h.id === id);
        if (heading) {
          vscode.postMessage({ type: 'scrollToLine', line: heading.line });
        }
      });
    });

    // ── Scroll-based active section ──
    const content = document.querySelector('.content');
    let headingEls = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

    let previewScrollTimeout = null;
    content.addEventListener('scroll', () => {
      let current = '';
      headingEls.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 80) {
          current = heading.id;
        }
      });
      setActiveTocItem(current);

      // Preview → Editor sync using current active heading
      if (scrollSource === 'editor') return;
      if (previewScrollTimeout) clearTimeout(previewScrollTimeout);
      previewScrollTimeout = setTimeout(() => {
        setScrollSource('preview');
        // Use the current active heading from headingData for accurate sync
        if (current) {
          const heading = headingData.find(h => h.id === current);
          if (heading) {
            vscode.postMessage({ type: 'scrollToLine', line: heading.line });
            return;
          }
        }
        // Fallback: find topmost visible element with data-line-start
        const els = content.querySelectorAll('[data-line-start]');
        let bestEl = null;
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) {
            bestEl = el;
          } else {
            break;
          }
        }
        if (bestEl) {
          const line = parseInt(bestEl.dataset.lineStart);
          vscode.postMessage({ type: 'scrollToLine', line: line });
        }
      }, 150);
    });

    // ── Syntax highlighting ──
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });

    // ── Code copy buttons ──
    document.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const text = code.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
      pre.appendChild(btn);
    });

    // ── Fix mermaid visibility after render ──
    function detectMermaidType(svg) {
      // Detect by internal elements since aria-roledescription may vary
      if (svg.querySelector('.grid .tick, .section')) return 'gantt';
      if (svg.querySelector('.actor, .messageLine0')) return 'sequence';
      if (svg.querySelector('.er.entityBox, .er.relationshipLine')) return 'er';
      if (svg.querySelector('.gitGraph')) return 'git';
      if (svg.querySelector('.journey-section')) return 'journey';
      // Compact types
      if (svg.querySelector('.flowchart-link, .edgePath')) return 'flowchart';
      if (svg.querySelector('.classGroup, path.relation')) return 'class';
      if (svg.querySelector('.statediagram-state')) return 'state';
      if (svg.querySelector('.pieCircle')) return 'pie';
      // Fallback: also check aria-roledescription
      return svg.getAttribute('aria-roledescription') || 'unknown';
    }

    function fixMermaidDiagrams() {
      const isLightMode = document.body.classList.contains('vscode-light');
      const lineColor = isLightMode ? '#475569' : '#58a6ff';
      const textColor = isLightMode ? '#1e293b' : '#e2e8f0';
      const subTextColor = isLightMode ? '#334155' : '#cbd5e1';
      const wideTypes = ['gantt', 'sequence', 'er', 'journey', 'timeline', 'git'];

      document.querySelectorAll('.mermaid svg').forEach(svg => {
        const type = detectMermaidType(svg);
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        if (wideTypes.includes(type)) {
          // Wide diagrams → full width
          svg.style.width = '100%';
        } else {
          // Compact diagrams → constrain to 700px, centered
          svg.setAttribute('width', '700');
          svg.removeAttribute('height');
          svg.style.maxWidth = '100%';
        }

        // Fix all marker arrowheads (path, circle, polygon — every child of marker)
        svg.querySelectorAll('marker path, marker circle, marker polygon, marker line, [id*="arrowhead"] path, [id*="crosshead"] path, [id*="arrow"] path').forEach(p => {
          p.setAttribute('fill', lineColor);
          p.setAttribute('stroke', lineColor);
        });
        // Fix relation lines (class diagram, ER, etc.)
        svg.querySelectorAll('path.relation, path[class*="transition"], .er.relationshipLine path').forEach(p => {
          p.setAttribute('stroke', lineColor);
          p.setAttribute('stroke-width', '2');
        });
        // Fix flowchart/edge paths
        svg.querySelectorAll('.edgePath path, path.flowchart-link').forEach(p => {
          p.setAttribute('stroke', lineColor);
          p.setAttribute('stroke-width', '2');
        });
        // Fix all generic lines
        svg.querySelectorAll('line').forEach(l => {
          const cls = l.getAttribute('class') || '';
          if (!cls.includes('divider')) {
            l.setAttribute('stroke', lineColor);
          }
        });

        // Sequence diagram: fix actor text & boxes
        svg.querySelectorAll('text.actor-box, .actor text, text[class*="actor"]').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('rect.actor').forEach(r => {
          if (!isLightMode) {
            r.setAttribute('fill', '#1e3a5f');
            r.setAttribute('stroke', '#60a5fa');
          }
        });

        // Gantt: fix text colors
        svg.querySelectorAll('.sectionTitle, .sectionTitle0, .sectionTitle1, .sectionTitle2, .sectionTitle3').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.taskText, .taskTextOutsideRight, .taskTextOutsideLeft').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.titleText').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.tick text').forEach(t => {
          t.setAttribute('fill', subTextColor);
        });

        // Universal: fix any remaining dark text on dark bg
        svg.querySelectorAll('text').forEach(t => {
          const fill = t.getAttribute('fill');
          if (!isLightMode && fill && (fill === '#000' || fill === '#000000' || fill === 'black' || fill === 'rgb(0, 0, 0)')) {
            t.setAttribute('fill', textColor);
          }
        });
      });
    }
    // Run after mermaid renders (slight delay needed)
    setTimeout(fixMermaidDiagrams, 500);
    setTimeout(fixMermaidDiagrams, 1500);
    setTimeout(fixMermaidDiagrams, 3000);

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
      editBtn.style.color = '#6CB6FF';
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

    let totalSlides = buildSlides();
    let currentSlide = 0;
    let allSlides = document.querySelectorAll('.slide');
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
      try {
        const nodes = Array.from(document.querySelectorAll('.slide-active .mermaid'));
        if (nodes.length > 0) {
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') mermaid.run({ nodes }).catch(() => {});
          else mermaid.init(undefined, nodes);
        }
      } catch(e) {}
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
      try {
        const nodes = Array.from(document.querySelectorAll('.slide-active .mermaid'));
        if (nodes.length > 0) {
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') mermaid.run({ nodes }).catch(() => {});
          else mermaid.init(undefined, nodes);
        }
      } catch(e) {}
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
  renderedHtml = processCallouts(renderedHtml);
  blocks.forEach((content, idx) => {
    renderedHtml = renderedHtml.replace(
      new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
      `<div class="mermaid">${escapeHtml(content)}</div>`
    );
  });

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
