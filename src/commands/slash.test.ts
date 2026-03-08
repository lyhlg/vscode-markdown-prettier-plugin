import { describe, it, expect, vi } from 'vitest';

vi.mock('vscode', () => ({
  languages: { registerCompletionItemProvider: vi.fn() },
  CompletionItem: class {},
  CompletionItemKind: { Snippet: 15 },
  SnippetString: class { constructor(public value: string) {} },
  Range: class { constructor(..._args: unknown[]) {} },
  MarkdownString: class { isTrusted = false; supportHtml = false; },
}));

import { slashCommands } from './slash';

describe('slashCommands', () => {
  it('should have at least 18 commands', () => {
    expect(slashCommands.length).toBeGreaterThanOrEqual(18);
  });

  it('should all start with /', () => {
    for (const cmd of slashCommands) {
      expect(cmd.label).toMatch(/^\//);
    }
  });

  it('should all have required fields', () => {
    for (const cmd of slashCommands) {
      expect(cmd.label).toBeTruthy();
      expect(cmd.detail).toBeTruthy();
      expect(cmd.snippet).toBeTruthy();
      expect(cmd.doc).toBeTruthy();
    }
  });

  it('should include heading commands', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/h1');
    expect(labels).toContain('/h2');
    expect(labels).toContain('/h3');
  });

  it('should include mermaid commands', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/mermaid');
    expect(labels).toContain('/mermaid-flowchart');
    expect(labels).toContain('/mermaid-sequence');
    expect(labels).toContain('/mermaid-class');
  });

  it('should include callout commands', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/note');
    expect(labels).toContain('/tip');
    expect(labels).toContain('/important');
    expect(labels).toContain('/warning');
    expect(labels).toContain('/caution');
  });

  it('should include text formatting commands', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/bold');
    expect(labels).toContain('/italic');
    expect(labels).toContain('/highlight');
    expect(labels).toContain('/strikethrough');
  });

  it('should include utility commands', () => {
    const labels = slashCommands.map(c => c.label);
    expect(labels).toContain('/codeblock');
    expect(labels).toContain('/table');
    expect(labels).toContain('/image');
    expect(labels).toContain('/link');
    expect(labels).toContain('/checkbox');
    expect(labels).toContain('/blockquote');
    expect(labels).toContain('/hr');
  });

  it('should have previewKey for visual commands', () => {
    const mermaidCmd = slashCommands.find(c => c.label === '/mermaid');
    expect(mermaidCmd?.previewKey).toBe('mermaid');

    const noteCmd = slashCommands.find(c => c.label === '/note');
    expect(noteCmd?.previewKey).toBe('note');
  });
});
