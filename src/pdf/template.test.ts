import { describe, it, expect } from 'vitest';
import { getPdfHtml } from './template';

describe('getPdfHtml', () => {
  it('should return valid HTML document', () => {
    const html = getPdfHtml('# Hello');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should include rendered markdown', () => {
    const html = getPdfHtml('# Hello\n\nWorld');
    expect(html).toContain('Hello');
    expect(html).toContain('World');
  });

  it('should include print styles', () => {
    const html = getPdfHtml('# Test');
    expect(html).toContain('@page');
    expect(html).toContain('print-color-adjust');
  });

  it('should include mermaid initialization', () => {
    const html = getPdfHtml('# Test');
    expect(html).toContain('mermaid.initialize');
  });

  it('should include highlight.js', () => {
    const html = getPdfHtml('# Test');
    expect(html).toContain('highlight.min.js');
  });

  it('should NOT include interactive elements', () => {
    const html = getPdfHtml('# Test');
    expect(html).not.toContain('acquireVsCodeApi');
    expect(html).not.toContain('presentation-mode');
    expect(html).not.toContain('font-controls');
  });

  it('should handle callouts in PDF', () => {
    const html = getPdfHtml('> [!NOTE]\n> Important info');
    expect(html).toContain('callout-note');
  });

  it('should handle mermaid in PDF', () => {
    const html = getPdfHtml('```mermaid\nflowchart TD\n    A-->B\n```');
    expect(html).toContain('class="mermaid"');
  });
});
