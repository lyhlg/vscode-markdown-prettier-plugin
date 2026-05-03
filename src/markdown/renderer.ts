import MarkdownIt from 'markdown-it';
import markdownItMark from 'markdown-it-mark';
import { Heading, RenderResult } from '../types';
import { escapeHtml } from '../utils';
import { stripFrontmatter } from './frontmatter';
import { preprocessMermaid } from './mermaid';
import { extractHeadings, generateTocHtml, addHeadingIds } from './headings';
import { processCallouts } from './callouts';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
md.use(markdownItMark);

// Plugin: inject source line numbers on block-level tokens
md.core.ruler.push('source_line_numbers', (state) => {
  const offset: number = (state.env && state.env.fmOffset) || 0;
  for (const token of state.tokens) {
    if (token.map && token.nesting !== -1) {
      token.attrPush(['data-line-start', String(token.map[0] + offset)]);
      token.attrPush(['data-line-end', String(token.map[1] + offset)]);
    }
  }
});

export { md };

export function renderMarkdown(markdown: string): RenderResult & { mermaidBlocks: string[] } {
  const { text: stripped, offset: fmOffset } = stripFrontmatter(markdown);
  const { processed, blocks } = preprocessMermaid(stripped);
  const headings = extractHeadings(stripped);
  let renderedHtml = md.render(processed, { fmOffset });
  renderedHtml = addHeadingIds(renderedHtml, headings);
  renderedHtml = processCallouts(renderedHtml);
  blocks.forEach((content, idx) => {
    renderedHtml = renderedHtml.replace(
      new RegExp(`<p[^>]*>MERMAID_PLACEHOLDER_${idx}</p>`),
      `<pre class="mermaid">${content}</pre>`
    );
  });
  const tocHtml = generateTocHtml(headings);
  const headingData = headings.map(h => ({ id: h.id, line: h.line }));
  return { renderedHtml, tocHtml, headingData, mermaidBlocks: blocks };
}
