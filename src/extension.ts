import * as vscode from 'vscode';
import * as path from 'path';
import { getFileName } from './utils';
import { renderMarkdown } from './markdown';
import { getWebviewContent } from './webview';
import { loadPreviewImages, registerCompletionProvider } from './commands';
import { exportToPdf } from './pdf';
import { sendToClaudeTerminal, onTerminalClosed } from './claude/terminal';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('markdownViewer.open', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showWarningMessage('Please open a markdown file first.');
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'markdownViewer',
      `Preview: ${getFileName(editor.document.uri)}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const sendContentUpdate = () => {
      const text = editor.document.getText();
      const { renderedHtml, tocHtml, headingData } = renderMarkdown(text);
      panel.webview.postMessage({
        type: 'updateContent',
        renderedHtml,
        tocHtml,
        headingData,
        rawMarkdown: text
      });
    };

    let isEditMode = false;
    let pendingSyncLine: number | null = null;

    panel.webview.html = getWebviewContent(editor.document.getText());

    // Receive messages from Webview
    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'askClaude') {
        const selectedText = message.text;
        const prompt = `Please improve the following markdown:\n\n${selectedText}`;
        sendToClaudeTerminal(prompt);
      } else if (message.type === 'editSave') {
        const doc = editor.document;
        const fullRange = new vscode.Range(
          doc.positionAt(0),
          doc.positionAt(doc.getText().length)
        );
        const wsEdit = new vscode.WorkspaceEdit();
        wsEdit.replace(doc.uri, fullRange, message.text);
        await vscode.workspace.applyEdit(wsEdit);
        await doc.save();
        isEditMode = false;
        sendContentUpdate();
      } else if (message.type === 'inlineEditSave') {
        const doc = editor.document;
        const startLine = message.lineStart;
        const endLine = Math.min(message.lineEnd, doc.lineCount);
        const range = new vscode.Range(
          new vscode.Position(startLine, 0),
          endLine < doc.lineCount
            ? new vscode.Position(endLine, 0)
            : doc.lineAt(doc.lineCount - 1).range.end
        );
        let newText = message.text;
        if (endLine < doc.lineCount && !newText.endsWith('\n')) {
          newText += '\n';
        }
        const inlineEdit = new vscode.WorkspaceEdit();
        inlineEdit.replace(doc.uri, range, newText);
        await vscode.workspace.applyEdit(inlineEdit);
        await doc.save();
        sendContentUpdate();
      } else if (message.type === 'exportPdf') {
        const doc = editor.document;
        const mdPath = doc.uri.fsPath;
        const markdown = doc.getText();

        panel.webview.postMessage({ type: 'pdfStatus', status: 'generating' });

        try {
          const pdfPath = await exportToPdf(markdown, mdPath);
          panel.webview.postMessage({ type: 'pdfStatus', status: 'done' });
          const openAction = await vscode.window.showInformationMessage(
            `PDF exported: ${path.basename(pdfPath)}`,
            'Open PDF', 'Show in Finder'
          );
          if (openAction === 'Open PDF') {
            vscode.env.openExternal(vscode.Uri.file(pdfPath));
          } else if (openAction === 'Show in Finder') {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(pdfPath));
          }
        } catch (err: any) {
          panel.webview.postMessage({ type: 'pdfStatus', status: 'error' });
          vscode.window.showErrorMessage(`PDF export failed: ${err.message}`);
        }
      } else if (message.type === 'editModeChanged') {
        isEditMode = message.active;
      } else if (message.type === 'scrollToLine') {
        const line = message.line;
        const visibleEditor = vscode.window.visibleTextEditors.find(
          e => e.document === editor.document
        );
        if (visibleEditor) {
          ignoreEditorScroll = true;
          const range = new vscode.Range(line, 0, line, 0);
          visibleEditor.revealRange(range, vscode.TextEditorRevealType.AtTop);
          setTimeout(() => { ignoreEditorScroll = false; }, 300);
        } else {
          pendingSyncLine = line;
        }
      }
    });

    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === editor.document && !isEditMode) {
        sendContentUpdate();
      }
    });

    const switchDisposable = vscode.window.onDidChangeActiveTextEditor(e => {
      if (e && e.document.languageId === 'markdown') {
        panel.title = `Preview: ${getFileName(e.document.uri)}`;
        panel.webview.html = getWebviewContent(e.document.getText());
      }
      if (e && e.document === editor.document && pendingSyncLine !== null) {
        const line = pendingSyncLine;
        pendingSyncLine = null;
        ignoreEditorScroll = true;
        const range = new vscode.Range(line, 0, line, 0);
        e.revealRange(range, vscode.TextEditorRevealType.AtTop);
        setTimeout(() => { ignoreEditorScroll = false; }, 300);
      }
    });

    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
    let ignoreEditorScroll = false;
    const scrollDisposable = vscode.window.onDidChangeTextEditorVisibleRanges(e => {
      if (ignoreEditorScroll) return;
      if (e.textEditor === editor && e.visibleRanges.length > 0) {
        if (scrollTimeout !== undefined) { clearTimeout(scrollTimeout); }
        scrollTimeout = setTimeout(() => {
          const firstLine = e.visibleRanges[0].start.line;
          panel.webview.postMessage({ type: 'syncScroll', line: firstLine });
        }, 150);
      }
    });

    panel.onDidDispose(() => {
      changeDisposable.dispose();
      switchDisposable.dispose();
      scrollDisposable.dispose();
    });
  });

  // Release reference when terminal is closed
  vscode.window.onDidCloseTerminal(t => onTerminalClosed(t));

  // ── Slash command autocomplete ──
  const previewImages = loadPreviewImages(context.extensionPath);
  const completionProvider = registerCompletionProvider(previewImages);

  context.subscriptions.push(disposable, completionProvider);
}

export function deactivate() {}
