# Exclude Manager 插件开发文档

## 一、项目概述

### 1.1 插件名称（建议）
- **英文**：Exclude Manager 或 Sync Exclude
- **中文**：排除项管理器
- **ID**：`exclude-manager`（或 `your-name.sync-exclude`）

### 1.2 核心目标
- **添加**：用户添加一个排除项（如 `sglang`）时，自动同步写入以下 4 个配置：
  - `files.exclude`
  - `search.exclude`
  - `python.analysis.exclude`
  - `cursorpyright.analysis.exclude`
- **删除**：在插件界面中可方便地删除某个排除项（如 `vllm`），并自动从上述 4 个配置中移除。
- **界面**：简洁美观，参考提供的 UI 草图（每行：输入框 + 删除按钮）。

### 1.3 适用环境
- VS Code
- Cursor（基于 VS Code，配置兼容）

---

## 二、功能规格

### 2.1 数据模型

- **排除项**：一个字符串，表示要排除的路径模式，例如：
  - `**/sglang/**`
  - `**/vllm/**`
  - `**/node_modules/**`
- 为保持与 VS Code 配置习惯一致，建议**默认使用 glob 模式**（如 `**/sglang/**`），用户输入 `sglang` 时可由插件自动补全为 `**/sglang/**`（可配置是否自动补全）。

### 2.2 同步规则

| 用户操作     | 对 4 个配置的影响 |
|-------------|-------------------|
| 添加排除项 A | 在 `files.exclude`、`search.exclude`、`python.analysis.exclude`、`cursorpyright.analysis.exclude` 中均添加 `A: true`（或约定好的值） |
| 删除排除项 B | 从上述 4 个配置中移除键 B |

- 只修改 **工作区配置**（`.vscode/settings.json`），不修改用户全局配置，避免影响其他项目。
- 若某配置项原本不存在，则先创建再写入；若已存在其他键，只增删我们管理的键，不触碰其他键。

### 2.3 界面功能（参考附图）

- **列表展示**：每行一个排除项。
  - 左侧：**可编辑的输入框**，显示当前排除模式（如 `**/sglang/**`）。
  - 右侧：**「删除」按钮**（图中为「删除」），点击后从列表和 4 个配置中移除该项。
- **新增**：提供「添加」入口（如输入框 + 添加按钮，或仅一个输入框回车即添加），将新项加入列表并执行同步。
- **持久化**：列表来源与 4 个配置保持一致（见下节「数据来源与一致性」）。

### 2.4 数据来源与一致性

- **方案 A（推荐）**：  
  以「自定义配置」为唯一数据源，例如在 `settings.json` 中增加一项：
  - `excludeManager.patterns`: `string[]`  
  插件只读写 `excludeManager.patterns`，并根据该数组同步更新上述 4 个 exclude。这样列表与 4 个配置永远一致，且易于理解和维护。
- **方案 B**：  
  以 4 个配置的「交集」或某一配置（如 `files.exclude`）为数据源，反向推导列表。实现复杂且容易出现多源不一致，不推荐。

**建议**：采用方案 A，并在文档中说明「由 Exclude Manager 管理的排除项请在此处添加/删除，勿在设置中手动改 4 个 exclude」。

---

## 三、界面设计（参考附图）

### 3.1 布局

- 使用 **Webview** 或 **Tree View + 输入框** 实现界面。
- 每行：`[ 输入框（显示/编辑排除模式） ] [ 删除 ]`，风格简洁，留白适中。

### 3.2 交互

- **添加**：输入新模式（支持输入 `sglang` 自动补全为 `**/sglang/**`，可选）→ 确认后追加到列表并同步到 4 个配置。
- **编辑**：在输入框中修改文本后，失焦或回车时更新该项并重新同步 4 个配置。
- **删除**：点击「删除」→ 从列表和 4 个配置中移除该项。
- **空状态**：当没有任何排除项时，显示友好提示（如「暂无排除项，在下方输入并添加」）。

### 3.3 视觉与文案

- 风格：简洁、偏工具型，可与 VS Code 深色/浅色主题协调。
- 删除按钮：红色或强调色，文案为「删除」即可（图中已采用）。
- 可选：支持简单 i18n（中/英）以兼顾中英文用户。

---

## 四、技术方案

### 4.1 技术栈

- **语言**：TypeScript
- **框架**：VS Code Extension API
- **构建**：VS Code 官方脚手架（yeoman generator）或直接使用 TypeScript + esbuild/webpack 打包

### 4.2 项目结构（建议）

```
exclude-manager/
├── package.json
├── tsconfig.json
├── src/
│   ├── extension.ts          # 入口：注册命令、视图、配置变更监听
│   ├── sync.ts               # 核心：根据 patterns 同步 4 个 exclude
│   ├── settings.ts           # 读写 excludeManager.patterns 与 workspace settings
│   └── ui/
│       ├── view.ts           # Webview 或 Tree 视图逻辑
│       └── template.html     # 若用 Webview：列表 + 输入框 + 删除按钮的 HTML
├── media/
│   └── icon.png              # 插件图标
└── README.md
```

### 4.3 核心流程

1. **启动/打开视图**：读取 `excludeManager.patterns`（若不存在则 `[]`），渲染列表。
2. **添加**：将新项 push 到 `patterns`，写回 `settings.json`，调用 `sync.writeExcludes(patterns)` 更新 4 个配置。
3. **编辑**：替换 `patterns` 中对应项，写回并再次 `sync.writeExcludes(patterns)`。
4. **删除**：从 `patterns` 中 remove 该项，写回并 `sync.writeExcludes(patterns)`。
5. **配置变更**：若用户在其他地方修改了 `excludeManager.patterns`，可监听 `onDidChangeConfiguration` 刷新 UI（可选）。

### 4.4 同步逻辑（sync.ts）要点

- 读取当前 workspace 的 `files.exclude`、`search.exclude`、`python.analysis.exclude`、`cursorpyright.analysis.exclude`（均为对象）。
- 根据 `patterns` 重建 4 个对象中「由本插件管理」的键：
  - 可约定：键名以某前缀或固定列表来自 `patterns`，其余键原样保留。
- 只更新上述 4 个配置项，其余配置不变；写入时使用 `workspace.getConfiguration().update(..., ConfigurationTarget.Workspace)`。

### 4.5 边界与细节

- **重复**：添加前检查是否已存在相同模式，避免重复。
- **空字符串**：忽略空字符串，不写入配置。
- **格式**：用户输入 `sglang` 时，可配置是否自动转为 `**/sglang/**`（`excludeManager.autoGlob: boolean`，默认 true）。
- **多工作区**：仅处理当前 workspace 的 settings；多根工作区可明确只处理第一个或当前焦点文件夹（与 VS Code 行为一致即可）。

---

## 五、插件图标

- **格式**：建议 128x128 或 256x256 PNG，带透明通道。
- **内容**：与「排除/过滤/列表管理」相关，例如：
  - 文件夹 + 斜杠/禁止符号；
  - 或列表 + 筛子图标。
- **风格**：简洁、易识别，与 VS Code 扩展图标风格接近。

---

## 六、配置项汇总（package.json contributions）

- **excludeManager.patterns**（array of string）：由插件维护的排除模式列表，只读/通过 UI 编辑亦可，高级用户可手改。
- **excludeManager.autoGlob**（boolean，默认 true）：输入 `sglang` 时是否自动转为 `**/sglang/**`。

---

## 七、命令与视图

- **命令**：如 `Exclude Manager: Open View` 或 `excludeManager.openView`，打开主界面。
- **视图**：建议放在侧边栏一个自定义 View Container 或放在「资源管理器」下方的小视图（如「排除项」），便于与文件树一起使用。

---

## 八、测试与发布

- **手动测试**：在 VS Code/Cursor 中 F5 启动扩展开发主机，验证：添加/编辑/删除排除项后，4 个配置是否正确更新；重启后是否一致。
- **发布**：可发布至 VS Code Marketplace（Cursor 兼容）；若仅自用，可用「从 VSIX 安装」方式。

---

## 九、文档与用户说明

- **README**：说明用途、配置项、如何添加/删除排除项、数据存在 `excludeManager.patterns` 及对 4 个 exclude 的同步关系。
- **CHANGELOG**：版本与变更记录。

---

## 十、待确认与可选增强

1. **模式格式**：是否统一为 `**/xxx/**`，还是允许用户输入任意 glob（如 `*.log`）？建议默认 `**/xxx/**`，高级用户可在界面输入完整 glob。
2. **删除确认**：删除时是否弹确认框？建议首次可做「无确认」，若用户反馈误删多再加可选确认。
3. **导入/导出**：是否需要在文档中预留「从现有 files.exclude 导入」或「导出列表」？可列为后续迭代。
4. **图标**：若你无设计资源，可先用占位图标，后续再替换为定制图标。

请你确认：  
- 插件名称与 ID、数据源方案（A/B）、是否自动补全 `**/xxx/**`、删除是否需要确认、以及是否接受上述项目结构与技术方案。确认后即可按此文档开始实现代码与界面。


插件名称采用 Exclude Manager
数据源方案 同步files.exclude中值对应的键，当前情况下是 ang，ang2
删除无需确认
