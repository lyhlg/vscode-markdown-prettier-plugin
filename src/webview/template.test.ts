import { describe, it, expect } from 'vitest';
import { getWebviewContent, getMermaidInitScript } from './template';
import { getStyles } from './styles';
import { getScripts } from './scripts';

describe('getWebviewContent', () => {
  it('should return valid HTML document', () => {
    const html = getWebviewContent('# Hello');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('should include rendered markdown', () => {
    const html = getWebviewContent('# Hello\n\nWorld');
    expect(html).toContain('Hello');
    expect(html).toContain('World');
  });

  it('should include TOC', () => {
    const html = getWebviewContent('# Title\n## Section');
    expect(html).toContain('toc-item');
    expect(html).toContain('Title');
    expect(html).toContain('Section');
  });

  it('should include heading data script', () => {
    const html = getWebviewContent('# Title');
    expect(html).toContain('heading-data');
    expect(html).toContain('"id"');
  });

  it('should include raw markdown data', () => {
    const html = getWebviewContent('# Title');
    expect(html).toContain('raw-markdown');
  });

  it('should include mermaid initialization', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('mermaid.initialize');
  });

  it('should include highlight.js', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('highlight.min.js');
  });

  it('should include font controls', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('fontMinus');
    expect(html).toContain('fontPlus');
    expect(html).toContain('pdfBtn');
  });

  it('should include presentation mode elements', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('slideNav');
    expect(html).toContain('presentBtn');
  });

  it('should include edit mode elements', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('editBtn');
    expect(html).toContain('editTextarea');
    expect(html).toContain('EDIT MODE');
  });

  it('should include floating toolbar', () => {
    const html = getWebviewContent('# Test');
    expect(html).toContain('askClaudeBtn');
    expect(html).toContain('Ask Claude to Improve');
  });
});

describe('getMermaidInitScript', () => {
  it('should contain light and dark theme variables', () => {
    const script = getMermaidInitScript();
    expect(script).toContain('vscode-light');
    expect(script).toContain('primaryColor');
    expect(script).toContain('lineColor');
  });
});

describe('getStyles', () => {
  it('should contain essential CSS selectors', () => {
    const css = getStyles();
    expect(css).toContain('.toc');
    expect(css).toContain('.content');
    expect(css).toContain('.mermaid');
    expect(css).toContain('.callout');
    expect(css).toContain('.floating-toolbar');
    expect(css).toContain('.slide');
    expect(css).toContain('.inline-editor');
    expect(css).toContain('vscode-light');
  });
});

describe('getScripts', () => {
  it('should contain essential JS function references', () => {
    const js = getScripts();
    expect(js).toContain('acquireVsCodeApi');
    expect(js).toContain('fixMermaidDiagrams');
    expect(js).toContain('buildSlides');
    expect(js).toContain('enterPresentation');
    expect(js).toContain('exitPresentation');
    expect(js).toContain('updateContent');
    expect(js).toContain('inlineEditing');
  });
});
