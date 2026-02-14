import * as vscode from "vscode";
import { getPatterns, normalizeNewPattern } from "../settings";
import { syncExcludes } from "../sync";

const SET_PATTERNS = "setPatterns";
const ADD = "add";
const REMOVE = "remove";
const UPDATE = "update";
const GET_PATTERNS = "getPatterns";

export class ExcludeManagerViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private _context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [],
    };
    webviewView.webview.html = getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((msg) => this.handleMessage(msg));
    this.sendPatterns();
  }

  private sendPatterns(): void {
    if (this._view?.webview) {
      this._view.webview.postMessage({ type: SET_PATTERNS, patterns: getPatterns() });
    }
  }

  private handleMessage(msg: { type: string; index?: number; value?: string }): void {
    try {
      switch (msg.type) {
        case GET_PATTERNS:
          this.sendPatterns();
          break;
        case ADD:
          if (msg.value != null) {
            if (!vscode.workspace.workspaceFolders?.length) {
              vscode.window.showWarningMessage("请先打开一个工作区文件夹");
              return;
            }
            const patterns = getPatterns();
            const normalized = normalizeNewPattern(msg.value);
            if (!normalized || patterns.includes(normalized)) return;
            patterns.push(normalized);
            syncExcludes(patterns);
            this.sendPatterns();
          }
          break;
        case REMOVE:
          if (msg.index != null) {
            if (!vscode.workspace.workspaceFolders?.length) {
              vscode.window.showWarningMessage("请先打开一个工作区文件夹");
              return;
            }
            const patterns = getPatterns();
            patterns.splice(msg.index, 1);
            syncExcludes(patterns);
            this.sendPatterns();
          }
          break;
        case UPDATE:
          if (msg.index != null && msg.value != null) {
            const patterns = getPatterns();
            const normalized = normalizeNewPattern(msg.value);
            if (!normalized) return;
            if (patterns[msg.index] === normalized) return;
            const exists = patterns.indexOf(normalized);
            if (exists >= 0 && exists !== msg.index) return;
            patterns[msg.index] = normalized;
            syncExcludes(patterns);
            this.sendPatterns();
          }
          break;
      }
    } catch (e) {
      vscode.window.showErrorMessage("Exclude Manager: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  refresh(): void {
    this.sendPatterns();
  }
}

function getHtml(webview: vscode.Webview): string {
  const nonce = Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  const csp = `default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}' ${webview.cspSource};`;
  const dark = "var(--vscode-input-background)";
  const border = "var(--vscode-input-border, #3c3c3c)";
  const fg = "var(--vscode-input-foreground)";
  const red = "var(--vscode-errorForeground, #f14c4c)";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp.replace(/"/g, "&quot;")}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 12px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: ${fg};
      background: transparent;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .row input {
      flex: 1;
      min-width: 0;
      padding: 6px 10px;
      background: ${dark};
      border: 1px solid ${border};
      border-radius: 4px;
      color: ${fg};
      font-size: inherit;
    }
    .row input:focus { outline: 1px solid var(--vscode-focusBorder); outline-offset: -1px; }
    .btn-del {
      flex-shrink: 0;
      padding: 6px 12px;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: ${red};
      cursor: pointer;
      font-size: inherit;
    }
    .btn-del:hover { background: var(--vscode-button-hoverBackground); }
    .add-row .btn-add {
      padding: 6px 14px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: inherit;
    }
    .add-row .btn-add:hover { background: var(--vscode-button-hoverBackground); }
    .empty { color: var(--vscode-descriptionForeground); padding: 12px 0; font-size: 13px; }
    #list { margin-bottom: 12px; }
  </style>
</head>
<body>
  <div id="list"></div>
  <div class="empty" id="empty" style="display:none;">暂无排除项，在下方输入并添加</div>
  <div class="row add-row">
    <input type="text" id="newInput" placeholder="例如 sglang 或 **/vllm/**" />
    <button type="button" class="btn-add" id="btnAdd">添加</button>
  </div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const listEl = document.getElementById('list');
    const emptyEl = document.getElementById('empty');
    const newInput = document.getElementById('newInput');
    const btnAdd = document.getElementById('btnAdd');

    function render(patterns) {
      listEl.innerHTML = '';
      emptyEl.style.display = patterns.length ? 'none' : 'block';
      patterns.forEach((p, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        const input = document.createElement('input');
        input.value = p;
        input.addEventListener('change', () => {
          const v = input.value.trim();
          if (v && v !== p) vscode.postMessage({ type: '${UPDATE}', index: i, value: v });
        });
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-del';
        btn.textContent = '删除';
        btn.addEventListener('click', (e) => { e.preventDefault(); vscode.postMessage({ type: '${REMOVE}', index: i }); });
        row.appendChild(input);
        row.appendChild(btn);
        listEl.appendChild(row);
      });
    }

    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === '${SET_PATTERNS}') render(msg.patterns || []);
    });
    vscode.postMessage({ type: '${GET_PATTERNS}' });

    btnAdd.addEventListener('click', (e) => {
      e.preventDefault();
      const v = newInput.value.trim();
      if (v) {
        vscode.postMessage({ type: '${ADD}', value: v });
        newInput.value = '';
      }
    });
    newInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnAdd.click();
    });
  </script>
</body>
</html>`;
}
