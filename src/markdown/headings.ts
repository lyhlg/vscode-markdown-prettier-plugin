import { Heading } from '../types';

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const idCount: Record<string, number> = {};
  const lines = markdown.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(`{3,}|~{3,})/.test(line.trimStart())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) { continue; }

    let level: number | null = null;
    let text: string | null = null;
    let headingLine = i;

    // ATX-style: # heading
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      level = match[1].length;
      text = match[2].replace(/[#*_`\[\]]/g, '').trim();
    }

    // Setext-style: text followed by === (H1) or --- (H2)
    if (!match && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (/^={2,}\s*$/.test(nextLine) && line.trim().length > 0) {
        level = 1;
        text = line.replace(/[#*_`\[\]]/g, '').trim();
      } else if (/^-{2,}\s*$/.test(nextLine) && line.trim().length > 0) {
        level = 2;
        text = line.replace(/[#*_`\[\]]/g, '').trim();
      }
    }

    if (level !== null && text) {
      let id = text
        .toLowerCase()
        .replace(/[^\w\s\u3131-\uD79D-]/g, '')
        .replace(/\s+/g, '-');

      // Append suffix for duplicate IDs
      if (idCount[id] !== undefined) {
        idCount[id]++;
        id = `${id}-${idCount[id]}`;
      } else {
        idCount[id] = 0;
      }

      headings.push({ level, text, id, line: headingLine });
    }
  }

  return headings;
}

export function generateTocHtml(headings: Heading[]): string {
  if (headings.length === 0) {
    return '<p class="toc-empty">No headings found</p>';
  }

  return headings
    .map(h => {
      const depth = h.level - 1;
      const indent = 12 + depth * 10;
      const guides = Array.from({ length: depth }, (_, i) =>
        `<span class="toc-guide" style="left: ${12 + i * 10}px"></span>`
      ).join('');
      return `<a class="toc-item toc-h${h.level}" href="#${h.id}" data-level="${h.level}" data-text="${h.text.replace(/"/g, '&quot;')}" style="padding-left: ${indent}px">${guides}${h.text}</a>`;
    })
    .join('\n');
}

export function addHeadingIds(html: string, headings: Heading[]): string {
  let result = html;
  for (const h of headings) {
    // Match only <hN> tags that do NOT already have an id attribute
    const tagRegex = new RegExp(`<h${h.level}(?![^>]*\\bid=)([ >])`, '');
    result = result.replace(tagRegex, `<h${h.level} id="${h.id}"$1`);
  }
  return result;
}
