import * as vscode from 'vscode';

let claudeTerminal: vscode.Terminal | undefined;

export function sendToClaudeTerminal(prompt: string) {
  if (!claudeTerminal || claudeTerminal.exitStatus !== undefined) {
    claudeTerminal = vscode.window.createTerminal({
      name: 'Claude Code',
      iconPath: new vscode.ThemeIcon('sparkle'),
    });
  }

  claudeTerminal.show();

  const escaped = prompt.replace(/'/g, "'\\''");
  claudeTerminal.sendText(`claude '${escaped}'`);
}

export function onTerminalClosed(terminal: vscode.Terminal) {
  if (terminal === claudeTerminal) {
    claudeTerminal = undefined;
  }
}
