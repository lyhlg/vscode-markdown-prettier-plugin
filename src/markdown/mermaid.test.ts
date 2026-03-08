import { describe, it, expect } from 'vitest';
import { preprocessMermaid } from './mermaid';

describe('preprocessMermaid', () => {
  it('should replace mermaid blocks with placeholders', () => {
    const md = 'text\n```mermaid\nflowchart TD\n    A-->B\n```\nmore text';
    const result = preprocessMermaid(md);
    expect(result.processed).toContain('MERMAID_PLACEHOLDER_0');
    expect(result.processed).not.toContain('```mermaid');
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toContain('flowchart TD');
  });

  it('should handle multiple mermaid blocks', () => {
    const md = '```mermaid\ngraph A\n```\n\n```mermaid\ngraph B\n```';
    const result = preprocessMermaid(md);
    expect(result.blocks).toHaveLength(2);
    expect(result.processed).toContain('MERMAID_PLACEHOLDER_0');
    expect(result.processed).toContain('MERMAID_PLACEHOLDER_1');
  });

  it('should handle no mermaid blocks', () => {
    const md = '# Hello\nNo mermaid here';
    const result = preprocessMermaid(md);
    expect(result.processed).toBe(md);
    expect(result.blocks).toHaveLength(0);
  });

  it('should handle Windows-style line endings', () => {
    const md = '```mermaid\r\nflowchart TD\r\n    A-->B\r\n```';
    const result = preprocessMermaid(md);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toContain('flowchart TD');
  });
});
