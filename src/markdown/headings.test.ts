import { describe, it, expect } from 'vitest';
import { extractHeadings, generateTocHtml, addHeadingIds } from './headings';

describe('extractHeadings', () => {
  it('should extract ATX-style headings', () => {
    const md = '# Title\n## Section\n### Subsection';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatchObject({ level: 1, text: 'Title', line: 0 });
    expect(headings[1]).toMatchObject({ level: 2, text: 'Section', line: 1 });
    expect(headings[2]).toMatchObject({ level: 3, text: 'Subsection', line: 2 });
  });

  it('should extract Setext-style headings', () => {
    const md = 'Title\n===\nSection\n---';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(2);
    expect(headings[0]).toMatchObject({ level: 1, text: 'Title' });
    expect(headings[1]).toMatchObject({ level: 2, text: 'Section' });
  });

  it('should generate unique IDs for duplicates', () => {
    const md = '# Title\n# Title\n# Title';
    const headings = extractHeadings(md);
    expect(headings[0].id).toBe('title');
    expect(headings[1].id).toBe('title-1');
    expect(headings[2].id).toBe('title-2');
  });

  it('should ignore headings inside code blocks', () => {
    const md = '```\n# Not a heading\n```\n# Real heading';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe('Real heading');
  });

  it('should handle empty markdown', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('should strip markdown formatting from heading text', () => {
    const md = '# **Bold** and `code`';
    const headings = extractHeadings(md);
    expect(headings[0].text).toBe('Bold and code');
  });

  it('should handle Korean characters in IDs', () => {
    const md = '# 한국어 제목';
    const headings = extractHeadings(md);
    expect(headings[0].id).toBe('한국어-제목');
  });

  it('should handle all 6 heading levels', () => {
    const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(6);
    expect(headings.map(h => h.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('generateTocHtml', () => {
  it('should return empty message for no headings', () => {
    expect(generateTocHtml([])).toContain('No headings found');
  });

  it('should generate toc items with correct classes', () => {
    const headings = [
      { level: 1, text: 'Title', id: 'title', line: 0 },
      { level: 2, text: 'Section', id: 'section', line: 5 },
    ];
    const html = generateTocHtml(headings);
    expect(html).toContain('toc-h1');
    expect(html).toContain('toc-h2');
    expect(html).toContain('href="#title"');
    expect(html).toContain('href="#section"');
  });

  it('should include data attributes', () => {
    const headings = [{ level: 2, text: 'Test', id: 'test', line: 3 }];
    const html = generateTocHtml(headings);
    expect(html).toContain('data-level="2"');
    expect(html).toContain('data-text="Test"');
  });

  it('should escape quotes in data-text', () => {
    const headings = [{ level: 1, text: 'Title "quoted"', id: 'title-quoted', line: 0 }];
    const html = generateTocHtml(headings);
    expect(html).toContain('&quot;');
  });
});

describe('addHeadingIds', () => {
  it('should add id attributes to heading tags', () => {
    const html = '<h1>Title</h1><h2>Section</h2>';
    const headings = [
      { level: 1, text: 'Title', id: 'title', line: 0 },
      { level: 2, text: 'Section', id: 'section', line: 1 },
    ];
    const result = addHeadingIds(html, headings);
    expect(result).toContain('<h1 id="title">');
    expect(result).toContain('<h2 id="section">');
  });

  it('should not add duplicate ids', () => {
    const html = '<h1 id="existing">Title</h1>';
    const headings = [{ level: 1, text: 'Title', id: 'title', line: 0 }];
    const result = addHeadingIds(html, headings);
    expect(result).toContain('id="existing"');
    expect(result).not.toContain('id="title"');
  });
});
