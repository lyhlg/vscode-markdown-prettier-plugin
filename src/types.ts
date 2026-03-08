export interface Heading {
  level: number;
  text: string;
  id: string;
  line: number;
}

export interface SlashCommand {
  label: string;
  detail: string;
  snippet: string;
  doc: string;
  previewKey?: string;
}

export interface RenderResult {
  renderedHtml: string;
  tocHtml: string;
  headingData: { id: string; line: number }[];
}
