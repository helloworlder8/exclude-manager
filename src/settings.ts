import * as vscode from "vscode";

/** Keys from files.exclude (workspace) as source of truth. */
export function getPatterns(): string[] {
  const config = vscode.workspace.getConfiguration(undefined, vscode.workspace.workspaceFolders?.[0]);
  const obj = config.get<Record<string, boolean>>("files.exclude") ?? {};
  return Object.keys(obj).filter((k) => obj[k] === true);
}

/** Use input as-is, no glob conversion. */
export function normalizeNewPattern(input: string): string {
  return input.trim();
}
