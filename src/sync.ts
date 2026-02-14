import * as vscode from "vscode";

const SETTINGS_FILE = ".vscode/settings.json";

/** Set all four exclude configs by writing .vscode/settings.json (ensures cursorpyright.analysis.exclude is persisted). */
export function syncExcludes(patterns: string[]): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return;

  const list = patterns.filter(Boolean);
  const obj: Record<string, boolean> = {};
  for (const p of list) obj[p] = true;

  const uri = vscode.Uri.joinPath(folder.uri, SETTINGS_FILE);
  let raw: Record<string, unknown> = {};
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  vscode.workspace.fs.readFile(uri).then(
    (buf) => {
      try {
        raw = JSON.parse(dec.decode(buf)) as Record<string, unknown>;
      } catch {
        // invalid JSON
      }
      raw["files.exclude"] = obj;
      raw["search.exclude"] = obj;
      raw["python.analysis.exclude"] = list;
      raw["cursorpyright.analysis.exclude"] = list;
      return vscode.workspace.fs.writeFile(uri, enc.encode(JSON.stringify(raw, null, 2)));
    },
    () => {
      raw["files.exclude"] = obj;
      raw["search.exclude"] = obj;
      raw["python.analysis.exclude"] = list;
      raw["cursorpyright.analysis.exclude"] = list;
      const dirUri = vscode.Uri.joinPath(folder.uri, ".vscode");
      return vscode.workspace.fs.createDirectory(dirUri).then(() =>
        vscode.workspace.fs.writeFile(uri, enc.encode(JSON.stringify(raw, null, 2)))
      );
    }
  ).then(
    () => { /* done */ },
    (err) => vscode.window.showErrorMessage("Exclude Manager: " + (err instanceof Error ? err.message : String(err)))
  );
}
