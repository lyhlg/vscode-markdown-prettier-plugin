import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './renderer';

describe('renderMarkdown', () => {
  it('should render basic markdown', () => {
    const result = renderMarkdown('# Hello\n\nParagraph');
    expect(result.renderedHtml).toContain('<h1');
    expect(result.renderedHtml).toContain('Hello');
    expect(result.renderedHtml).toContain('<p');
    expect(result.renderedHtml).toContain('Paragraph');
  });

  it('should extract headings', () => {
    const result = renderMarkdown('# Title\n## Section');
    expect(result.headingData).toHaveLength(2);
    expect(result.headingData[0].id).toBe('title');
    expect(result.headingData[1].id).toBe('section');
  });

  it('should generate TOC HTML', () => {
    const result = renderMarkdown('# Title\n## Section');
    expect(result.tocHtml).toContain('toc-item');
    expect(result.tocHtml).toContain('Title');
  });

  it('should handle mermaid blocks', () => {
    const result = renderMarkdown('```mermaid\nflowchart TD\n    A-->B\n```');
    expect(result.renderedHtml).toContain('class="mermaid"');
    expect(result.renderedHtml).not.toContain('MERMAID_PLACEHOLDER');
    expect(result.mermaidBlocks).toHaveLength(1);
  });

  it('should process callouts', () => {
    const result = renderMarkdown('> [!NOTE]\n> This is a note');
    expect(result.renderedHtml).toContain('callout-note');
  });

  it('should strip frontmatter', () => {
    const result = renderMarkdown('---\ntitle: Test\n---\n# Hello');
    expect(result.renderedHtml).not.toContain('title: Test');
    expect(result.renderedHtml).toContain('Hello');
  });

  it('should add heading ids', () => {
    const result = renderMarkdown('# My Title');
    expect(result.renderedHtml).toContain('id="my-title"');
  });

  it('should add data-line attributes', () => {
    const result = renderMarkdown('# Title\n\nParagraph');
    expect(result.renderedHtml).toContain('data-line-start');
  });

  it('should handle empty markdown', () => {
    const result = renderMarkdown('');
    expect(result.renderedHtml).toBe('');
    expect(result.headingData).toEqual([]);
  });

  it('should handle mark syntax', () => {
    const result = renderMarkdown('==highlighted==');
    expect(result.renderedHtml).toContain('<mark>');
  });

  it('should escape mermaid content in HTML', () => {
    const result = renderMarkdown('```mermaid\nA --> B & C\n```');
    expect(result.renderedHtml).toContain('&amp;');
  });
});
