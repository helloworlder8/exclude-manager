import * as vscode from "vscode";
import { ExcludeManagerViewProvider } from "./ui/view";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new ExcludeManagerViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("excludeManager.list", provider)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("excludeManager.openView", () => {
      vscode.commands.executeCommand("workbench.view.extension.exclude-manager");
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("files.exclude")) provider.refresh();
    })
  );
}

export function deactivate(): void {}
