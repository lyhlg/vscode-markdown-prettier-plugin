export function stripFrontmatter(markdown: string): { text: string; offset: number } {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (match) {
    const offset = match[0].split('\n').length - 1;
    return { text: markdown.slice(match[0].length), offset };
  }
  return { text: markdown, offset: 0 };
}
