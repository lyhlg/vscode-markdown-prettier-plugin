import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { getPdfHtml } from './template';

export function findChrome(): string | null {
  const candidates: string[] =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : process.platform === 'win32'
        ? [
            path.join(process.env.PROGRAMFILES || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
            path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
          ]
        : ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium'];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) { return p; }
    } catch {
      // skip
    }
  }
  return null;
}

export function exportToPdf(markdown: string, mdFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chrome = findChrome();
    if (!chrome) {
      reject(new Error(
        'Chrome/Chromium/Edge not found. Please install Google Chrome to export PDF.'
      ));
      return;
    }

    const html = getPdfHtml(markdown);
    const tmpHtml = path.join(os.tmpdir(), `md-pdf-${Date.now()}.html`);
    fs.writeFileSync(tmpHtml, html, 'utf-8');

    const parsed = path.parse(mdFilePath);
    const pdfPath = path.join(parsed.dir, `${parsed.name}.pdf`);

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-software-rasterizer',
      `--print-to-pdf=${pdfPath}`,
      '--print-to-pdf-no-header',
      '--virtual-time-budget=5000',
      `file://${tmpHtml}`,
    ];

    execFile(chrome, args, { timeout: 30000 }, (error) => {
      try { fs.unlinkSync(tmpHtml); } catch {}
      if (error) {
        reject(error);
      } else {
        resolve(pdfPath);
      }
    });
  });
}
