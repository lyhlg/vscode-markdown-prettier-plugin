export function preprocessMermaid(markdown: string): { processed: string; blocks: string[] } {
  const blocks: string[] = [];
  const processed = markdown.replace(
    /```mermaid\r?\n([\s\S]*?)```/g,
    (_, content) => {
      const idx = blocks.length;
      blocks.push(content);
      return `\n\nMERMAID_PLACEHOLDER_${idx}\n\n`;
    }
  );
  return { processed, blocks };
}
