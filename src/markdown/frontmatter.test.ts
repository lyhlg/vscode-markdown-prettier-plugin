import { describe, it, expect } from 'vitest';
import { stripFrontmatter } from './frontmatter';

describe('stripFrontmatter', () => {
  it('should strip YAML frontmatter', () => {
    const md = '---\ntitle: Test\ndate: 2024-01-01\n---\n# Hello';
    const result = stripFrontmatter(md);
    expect(result.text).toBe('# Hello');
    expect(result.offset).toBe(4);
  });

  it('should handle no frontmatter', () => {
    const md = '# Hello\nWorld';
    const result = stripFrontmatter(md);
    expect(result.text).toBe('# Hello\nWorld');
    expect(result.offset).toBe(0);
  });

  it('should handle frontmatter with single field', () => {
    const md = '---\ntitle: Test\n---\nContent';
    const result = stripFrontmatter(md);
    expect(result.text).toBe('Content');
    expect(result.offset).toBe(3);
  });

  it('should handle Windows-style line endings', () => {
    const md = '---\r\ntitle: Test\r\n---\r\n# Hello';
    const result = stripFrontmatter(md);
    expect(result.text).toBe('# Hello');
  });

  it('should not strip incomplete frontmatter', () => {
    const md = '---\ntitle: Test\n# Hello';
    const result = stripFrontmatter(md);
    expect(result.text).toBe(md);
    expect(result.offset).toBe(0);
  });
});
