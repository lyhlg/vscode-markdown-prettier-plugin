import { describe, it, expect } from 'vitest';
import { escapeHtml, getFileName } from './utils';

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('should escape angle brackets', () => {
    expect(escapeHtml('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
  });

  it('should escape all special chars together', () => {
    expect(escapeHtml('<a&b>')).toBe('&lt;a&amp;b&gt;');
  });

  it('should return empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should return plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('getFileName', () => {
  it('should extract filename from path', () => {
    expect(getFileName({ path: '/Users/test/file.md' })).toBe('file.md');
  });

  it('should return default for empty path', () => {
    expect(getFileName({ path: '' })).toBe('Markdown');
  });

  it('should handle root path', () => {
    expect(getFileName({ path: '/' })).toBe('Markdown');
  });
});
