import { describe, it, expect, vi } from 'vitest';

// Mock vscode module (required by commands/slash.ts)
vi.mock('vscode', () => ({
  languages: { registerCompletionItemProvider: vi.fn() },
  CompletionItem: class {},
  CompletionItemKind: { Snippet: 15 },
  SnippetString: class { constructor(public value: string) {} },
  Range: class { constructor(..._args: unknown[]) {} },
  MarkdownString: class { isTrusted = false; supportHtml = false; },
}));

import { renderMarkdown } from './markdown/renderer';
import { getWebviewContent } from './webview/template';
import { getPdfHtml } from './pdf/template';
import { extractHeadings, generateTocHtml, addHeadingIds } from './markdown/headings';
import { processCallouts } from './markdown/callouts';
import { stripFrontmatter } from './markdown/frontmatter';
import { preprocessMermaid } from './markdown/mermaid';
import { escapeHtml } from './utils';
import { slashCommands } from './commands/slash';

// Comprehensive test markdown covering ALL features
const FULL_TEST_MARKDOWN = `---
title: Test Document
date: 2024-01-01
---

# Main Title

## Section One

This is a paragraph with **bold**, *italic*, ==highlight==, and ~~strikethrough~~ text.

### Code Example

\`\`\`typescript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

Inline code: \`const x = 1\`

## Section Two

> [!NOTE]
> This is an important note.

> [!TIP]
> Here's a helpful tip.

> [!WARNING]
> Be careful with this.

> [!CAUTION]
> This could be dangerous.

> [!IMPORTANT]
> Key information here.

> [!DANGER]
> Very dangerous operation.

> Normal blockquote without callout

## Mermaid Diagrams

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[Cancel]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    Alice->>+Bob: Request
    Bob-->>-Alice: Response
\`\`\`

## Tables

| Name | Role | Team |
|------|------|------|
| Alice | Engineer | FE |
| Bob | Designer | Design |

## Lists

- Item 1
- Item 2
  - Nested item
- Item 3

1. First
2. Second
3. Third

## Task List

- [x] Completed task
- [ ] Pending task

## Links & Images

[GitHub](https://github.com)

![Alt text](image.png)

---

## Slide Two (after HR)

Content on slide two.

## Duplicate Heading

## Duplicate Heading

## Korean 제목

Setext H1
===

Setext H2
---
`;

describe('Feature Verification: Frontmatter', () => {
  it('should strip frontmatter and calculate correct offset', () => {
    const result = stripFrontmatter(FULL_TEST_MARKDOWN);
    expect(result.text).not.toContain('title: Test Document');
    expect(result.text.startsWith('\n# Main Title')).toBe(true);
    expect(result.offset).toBe(4); // 5 lines in match[0] minus 1 = 4
  });
});

describe('Feature Verification: Mermaid Preprocessing', () => {
  it('should extract both mermaid blocks', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const result = preprocessMermaid(text);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]).toContain('flowchart TD');
    expect(result.blocks[1]).toContain('sequenceDiagram');
    expect(result.processed).toContain('MERMAID_PLACEHOLDER_0');
    expect(result.processed).toContain('MERMAID_PLACEHOLDER_1');
    expect(result.processed).not.toContain('```mermaid');
  });
});

describe('Feature Verification: Heading Extraction', () => {
  it('should extract all headings including Korean and setext', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const headings = extractHeadings(text);

    // Check key headings are found
    const texts = headings.map(h => h.text);
    expect(texts).toContain('Main Title');
    expect(texts).toContain('Section One');
    expect(texts).toContain('Code Example');
    expect(texts).toContain('Section Two');
    expect(texts).toContain('Mermaid Diagrams');
    expect(texts).toContain('Tables');
    expect(texts).toContain('Lists');
    expect(texts).toContain('Task List');
    expect(texts).toContain('Links & Images');
    expect(texts).toContain('Slide Two (after HR)');
    expect(texts).toContain('Korean 제목');
  });

  it('should handle duplicate heading IDs', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const headings = extractHeadings(text);
    const duplicates = headings.filter(h => h.text === 'Duplicate Heading');
    expect(duplicates).toHaveLength(2);
    expect(duplicates[0].id).toBe('duplicate-heading');
    expect(duplicates[1].id).toBe('duplicate-heading-1');
  });

  it('should ignore headings inside code blocks', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const headings = extractHeadings(text);
    const texts = headings.map(h => h.text);
    // "const greeting" is inside a code block, should not appear as heading
    expect(texts).not.toContain('const greeting');
  });

  it('should detect setext-style headings', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const headings = extractHeadings(text);
    const setextH1 = headings.find(h => h.text === 'Setext H1');
    const setextH2 = headings.find(h => h.text === 'Setext H2');
    expect(setextH1).toBeDefined();
    expect(setextH1?.level).toBe(1);
    expect(setextH2).toBeDefined();
    expect(setextH2?.level).toBe(2);
  });
});

describe('Feature Verification: TOC Generation', () => {
  it('should generate TOC with correct structure', () => {
    const { text } = stripFrontmatter(FULL_TEST_MARKDOWN);
    const headings = extractHeadings(text);
    const toc = generateTocHtml(headings);

    expect(toc).toContain('toc-h1');
    expect(toc).toContain('toc-h2');
    expect(toc).toContain('toc-h3');
    expect(toc).toContain('href="#main-title"');
    expect(toc).toContain('href="#section-one"');
    expect(toc).toContain('data-level=');
    expect(toc).toContain('data-text=');
    // Should include guide spans for nested items
    expect(toc).toContain('toc-guide');
  });
});

describe('Feature Verification: Callout Processing', () => {
  it('should process all 6 callout types', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('callout-note');
    expect(result.renderedHtml).toContain('callout-tip');
    expect(result.renderedHtml).toContain('callout-warning');
    expect(result.renderedHtml).toContain('callout-caution');
    expect(result.renderedHtml).toContain('callout-important');
    expect(result.renderedHtml).toContain('callout-danger');
  });

  it('should include callout icons and labels', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('callout-title');
    expect(result.renderedHtml).toContain('<svg');
    expect(result.renderedHtml).toContain('Note');
    expect(result.renderedHtml).toContain('Tip');
    expect(result.renderedHtml).toContain('Warning');
  });

  it('should leave normal blockquotes unchanged', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<blockquote');
    expect(result.renderedHtml).toContain('Normal blockquote without callout');
  });
});

describe('Feature Verification: Mermaid in Final Output', () => {
  it('should replace placeholders with mermaid divs', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).not.toContain('MERMAID_PLACEHOLDER');
    expect(result.renderedHtml).toContain('class="mermaid"');
    // Content should be HTML-escaped
    expect(result.renderedHtml).toContain('flowchart TD');
  });

  it('should return mermaid blocks for client-side rendering', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.mermaidBlocks).toHaveLength(2);
  });
});

describe('Feature Verification: Rendered HTML', () => {
  it('should include data-line attributes for scroll sync', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('data-line-start');
    expect(result.renderedHtml).toContain('data-line-end');
  });

  it('should add heading IDs', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('id="main-title"');
    expect(result.renderedHtml).toContain('id="section-one"');
    expect(result.renderedHtml).toContain('id="section-two"');
  });

  it('should render markdown formatting', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<strong>');
    expect(result.renderedHtml).toContain('<em>');
    expect(result.renderedHtml).toContain('<mark>');
    expect(result.renderedHtml).toContain('<s>'); // markdown-it uses <s> for ~~strikethrough~~
  });

  it('should render tables', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<table'); // has data-line-* attributes
    expect(result.renderedHtml).toContain('<th>');
    expect(result.renderedHtml).toContain('Alice');
  });

  it('should render lists', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<ul'); // has data-line-* attributes
    expect(result.renderedHtml).toContain('<ol'); // has data-line-* attributes
    expect(result.renderedHtml).toContain('<li');
  });

  it('should render task lists', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    // markdown-it renders task list markers as literal text [x] / [ ]
    expect(result.renderedHtml).toContain('[x]');
    expect(result.renderedHtml).toContain('[ ]');
  });

  it('should render links', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('href="https://github.com"');
    expect(result.renderedHtml).toContain('GitHub');
  });

  it('should render images', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<img');
    expect(result.renderedHtml).toContain('image.png');
  });

  it('should render horizontal rules (slide dividers)', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<hr'); // has data-line-* attributes
  });

  it('should render code blocks', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<pre>');
    expect(result.renderedHtml).toContain('<code');
    expect(result.renderedHtml).toContain('greeting');
  });

  it('should render inline code', () => {
    const result = renderMarkdown(FULL_TEST_MARKDOWN);
    expect(result.renderedHtml).toContain('<code>const x = 1</code>');
  });
});

describe('Feature Verification: Webview HTML', () => {
  it('should produce complete HTML document', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include all external dependencies', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('highlight.min.js');
    expect(html).toContain('dockerfile.min.js');
    expect(html).toContain('mermaid@10.9.0');
    expect(html).toContain('atom-one-dark.min.css');
  });

  it('should include mermaid initialization with theme support', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('mermaid.initialize');
    expect(html).toContain('vscode-light');
    expect(html).toContain('primaryColor');
    expect(html).toContain('arrowheadColor');
  });

  it('should include TOC sidebar with search', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="toc"');
    expect(html).toContain('id="tocSearch"');
    expect(html).toContain('id="tocToggle"');
    expect(html).toContain('id="tocResizeHandle"');
    expect(html).toContain('toc-items');
  });

  it('should include font controls', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="fontMinus"');
    expect(html).toContain('id="fontPlus"');
    expect(html).toContain('id="fontSizeLabel"');
  });

  it('should include presentation mode elements', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="presentBtn"');
    expect(html).toContain('id="slideNav"');
    expect(html).toContain('id="slidePrev"');
    expect(html).toContain('id="slideNext"');
    expect(html).toContain('id="slideExit"');
    expect(html).toContain('id="slideCounter"');
  });

  it('should include edit mode elements', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="editBtn"');
    expect(html).toContain('id="editTextarea"');
    expect(html).toContain('edit-status');
    expect(html).toContain('EDIT MODE');
  });

  it('should include PDF export button', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="pdfBtn"');
  });

  it('should include floating toolbar with Claude', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="toolbar"');
    expect(html).toContain('id="askClaudeBtn"');
    expect(html).toContain('Ask Claude to Improve');
  });

  it('should include heading-data and raw-markdown scripts', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    expect(html).toContain('id="heading-data"');
    expect(html).toContain('id="raw-markdown"');
  });

  it('should include all JS features in scripts', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    // Scroll sync
    expect(html).toContain('syncScroll');
    expect(html).toContain('scrollToLine');
    expect(html).toContain('setScrollSource');
    // Content update (scroll preservation)
    expect(html).toContain('updateContent');
    expect(html).toContain('savedScrollTop');
    // Mermaid fix
    expect(html).toContain('fixMermaidDiagrams');
    expect(html).toContain('detectMermaidType');
    // Inline edit
    expect(html).toContain('inlineEditSave');
    expect(html).toContain('dblclick');
    // Full edit mode
    expect(html).toContain('enterEditMode');
    expect(html).toContain('exitEditMode');
    expect(html).toContain('saveEdit');
    // Presentation mode
    expect(html).toContain('buildSlides');
    expect(html).toContain('enterPresentation');
    expect(html).toContain('exitPresentation');
    expect(html).toContain('goToSlide');
    // PDF export status
    expect(html).toContain('pdfStatus');
    expect(html).toContain('pdfExporting');
    // Syntax highlighting
    expect(html).toContain('hljs.highlightElement');
    // Code copy
    expect(html).toContain('code-copy-btn');
    expect(html).toContain('navigator.clipboard');
    // vscode API
    expect(html).toContain('acquireVsCodeApi');
    expect(html).toContain('vscode.postMessage');
    expect(html).toContain('vscode.getState');
    expect(html).toContain('vscode.setState');
  });

  it('should include all CSS features', () => {
    const html = getWebviewContent(FULL_TEST_MARKDOWN);
    // Core layout
    expect(html).toContain('.container');
    expect(html).toContain('.toc');
    expect(html).toContain('.content');
    // Dark mode (default)
    expect(html).toContain('--vscode-editor-foreground');
    expect(html).toContain('--vscode-editor-background');
    // Light mode
    expect(html).toContain('body.vscode-light');
    // Callout styles
    expect(html).toContain('.callout-note');
    expect(html).toContain('.callout-tip');
    expect(html).toContain('.callout-important');
    expect(html).toContain('.callout-warning');
    expect(html).toContain('.callout-caution');
    expect(html).toContain('.callout-danger');
    // Mermaid styles
    expect(html).toContain('.mermaid');
    expect(html).toContain('.edgePath');
    expect(html).toContain('.arrowheadPath');
    // Interactive elements
    expect(html).toContain('.floating-toolbar');
    expect(html).toContain('.inline-editor');
    expect(html).toContain('.inline-edit-textarea');
    expect(html).toContain('.slide-nav');
    expect(html).toContain('.font-controls');
    expect(html).toContain('.code-copy-btn');
    // Highlight.js light mode
    expect(html).toContain('.hljs-keyword');
    expect(html).toContain('.hljs-string');
  });
});

describe('Feature Verification: PDF HTML', () => {
  it('should produce print-optimized HTML', () => {
    const html = getPdfHtml(FULL_TEST_MARKDOWN);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('@page');
    expect(html).toContain('print-color-adjust');
    expect(html).toContain('page-break-inside: avoid');
    expect(html).toContain('page-break-after: avoid');
  });

  it('should NOT include interactive elements', () => {
    const html = getPdfHtml(FULL_TEST_MARKDOWN);
    expect(html).not.toContain('acquireVsCodeApi');
    expect(html).not.toContain('presentation-mode');
    expect(html).not.toContain('.font-controls');
    expect(html).not.toContain('.floating-toolbar');
    expect(html).not.toContain('.inline-editor');
  });

  it('should include rendered content', () => {
    const html = getPdfHtml(FULL_TEST_MARKDOWN);
    expect(html).toContain('Main Title');
    expect(html).toContain('callout-note');
    expect(html).toContain('class="mermaid"');
  });
});

describe('Feature Verification: Slash Commands', () => {
  it('should have exactly the same 23 commands', () => {
    expect(slashCommands).toHaveLength(23);
  });

  it('should include all heading shortcuts', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/h1');
    expect(labels).toContain('/h2');
    expect(labels).toContain('/h3');
  });

  it('should include all mermaid shortcuts', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/mermaid');
    expect(labels).toContain('/mermaid-flowchart');
    expect(labels).toContain('/mermaid-sequence');
    expect(labels).toContain('/mermaid-class');
  });

  it('should include all callout shortcuts', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/note');
    expect(labels).toContain('/tip');
    expect(labels).toContain('/important');
    expect(labels).toContain('/warning');
    expect(labels).toContain('/caution');
  });

  it('should include all formatting shortcuts', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/bold');
    expect(labels).toContain('/italic');
    expect(labels).toContain('/highlight');
    expect(labels).toContain('/strikethrough');
  });

  it('should include all element shortcuts', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/codeblock');
    expect(labels).toContain('/table');
    expect(labels).toContain('/image');
    expect(labels).toContain('/link');
    expect(labels).toContain('/checkbox');
    expect(labels).toContain('/blockquote');
    expect(labels).toContain('/hr');
  });

  it('should have valid snippets (contain ${})', () => {
    for (const cmd of slashCommands) {
      // /hr doesn't use snippets variables
      if (cmd.label === '/hr') continue;
      expect(cmd.snippet).toContain('${');
    }
  });

  it('should have previewKey for commands with visual output', () => {
    const withPreview = slashCommands.filter(c => c.previewKey);
    const previewKeys = withPreview.map(c => c.previewKey);
    expect(previewKeys).toContain('codeblock');
    expect(previewKeys).toContain('table');
    expect(previewKeys).toContain('mermaid');
    expect(previewKeys).toContain('mermaid-flowchart');
    expect(previewKeys).toContain('mermaid-sequence');
    expect(previewKeys).toContain('mermaid-class');
    expect(previewKeys).toContain('note');
    expect(previewKeys).toContain('tip');
    expect(previewKeys).toContain('important');
    expect(previewKeys).toContain('warning');
    expect(previewKeys).toContain('caution');
    expect(previewKeys).toContain('checkbox');
  });
});

describe('Feature Verification: escapeHtml', () => {
  it('should escape mermaid content correctly', () => {
    const mermaidContent = 'A --> B & C < D > E';
    const escaped = escapeHtml(mermaidContent);
    expect(escaped).toBe('A --&gt; B &amp; C &lt; D &gt; E');
  });
});
