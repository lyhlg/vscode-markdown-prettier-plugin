import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SlashCommand } from '../types';

function mermaidImgUrl(code: string): string {
  const json = JSON.stringify({ code, mermaid: { theme: 'dark' } });
  return `https://mermaid.ink/img/${Buffer.from(json).toString('base64')}`;
}

export function loadPreviewImages(extensionPath: string): Record<string, string> {
  const previewsDir = path.join(extensionPath, 'media', 'previews');
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
  return previewImages;
}

function previewImg(previewImages: Record<string, string>, name: string): string {
  const uri = previewImages[name];
  return uri ? `![preview](${uri})\n\n` : '';
}

export const slashCommands: SlashCommand[] = [
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

const mermaidExamples: Record<string, string> = {
  'mermaid': 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]',
  'mermaid-flowchart': 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[OK]\n    B -->|No| D[Cancel]',
  'mermaid-sequence': 'sequenceDiagram\n    Alice->>+Bob: Request\n    Bob-->>-Alice: Response\n    Alice->>+Server: API Call\n    Server-->>-Alice: Data',
  'mermaid-class': 'classDiagram\n    class Animal {\n        +String name\n        +move() void\n    }\n    class Dog {\n        +bark() void\n    }\n    Animal <|-- Dog : extends',
};

export function registerCompletionProvider(previewImages: Record<string, string>): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    'markdown',
    {
      provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text;
        const linePrefix = lineText.substring(0, position.character);

        const slashIdx = linePrefix.lastIndexOf('/');
        if (slashIdx === -1) { return []; }

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
            let docContent = '';
            if (cmd.previewKey && previewImages[cmd.previewKey]) {
              docContent += previewImg(previewImages, cmd.previewKey);
            } else if (cmd.previewKey?.startsWith('mermaid')) {
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
}
