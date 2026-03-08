import { describe, it, expect } from 'vitest';
import { processCallouts, CALLOUT_TYPES } from './callouts';

describe('CALLOUT_TYPES', () => {
  it('should have all 6 callout types', () => {
    expect(Object.keys(CALLOUT_TYPES)).toEqual(['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION', 'DANGER']);
  });

  it('should have label and icon for each type', () => {
    for (const [key, value] of Object.entries(CALLOUT_TYPES)) {
      expect(value.label).toBeTruthy();
      expect(value.icon).toContain('<svg');
    }
  });
});

describe('processCallouts', () => {
  it('should convert NOTE callout with <br>', () => {
    const html = '<blockquote><p>[!NOTE]<br>This is a note</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('class="callout callout-note"');
    expect(result).toContain('class="callout-title"');
    expect(result).toContain('Note');
    expect(result).toContain('This is a note');
  });

  it('should convert TIP callout', () => {
    const html = '<blockquote><p>[!TIP]<br>This is a tip</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-tip');
    expect(result).toContain('Tip');
  });

  it('should convert WARNING callout', () => {
    const html = '<blockquote><p>[!WARNING]<br>Be careful</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-warning');
    expect(result).toContain('Warning');
  });

  it('should convert CAUTION callout', () => {
    const html = '<blockquote><p>[!CAUTION]<br>Dangerous</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-caution');
  });

  it('should convert DANGER callout', () => {
    const html = '<blockquote><p>[!DANGER]<br>Very dangerous</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-danger');
  });

  it('should convert IMPORTANT callout', () => {
    const html = '<blockquote><p>[!IMPORTANT]<br>Key info</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-important');
    expect(result).toContain('Important');
  });

  it('should be case-insensitive', () => {
    const html = '<blockquote><p>[!note]<br>lowercase note</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-note');
  });

  it('should leave regular blockquotes unchanged', () => {
    const html = '<blockquote><p>Just a normal quote</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toBe(html);
  });

  it('should handle callout with separate paragraphs', () => {
    const html = '<blockquote><p>[!NOTE]</p><p>Content in next paragraph</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-note');
    expect(result).toContain('Content in next paragraph');
  });

  it('should handle callout with newline separator', () => {
    const html = '<blockquote><p>[!TIP]\nContent after newline</p></blockquote>';
    const result = processCallouts(html);
    expect(result).toContain('callout-tip');
    expect(result).toContain('Content after newline');
  });
});
