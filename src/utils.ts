export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function getFileName(uri: { path: string }): string {
  return uri.path.split('/').pop() || 'Markdown';
}
