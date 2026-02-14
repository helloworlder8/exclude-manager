# Exclude Manager

在 VS Code / Cursor 中统一管理排除项，并自动同步到以下配置：

- `files.exclude`
- `search.exclude`
- `python.analysis.exclude`
- `cursorpyright.analysis.exclude`

## 功能

- **列表**：以 `files.exclude` 的键为数据源，在侧边栏显示当前排除项
- **添加**：输入模式（如 `sglang` 或 `**/vllm/**`）并添加，自动写入上述 4 项
- **编辑**：在输入框中修改后失焦或回车即可更新并同步
- **删除**：点击「删除」从列表和 4 个配置中移除，无需确认

## 使用

1. 打开侧边栏中的 **Exclude Manager** 视图（图标在活动栏）
2. 在底部输入框输入要排除的模式，点击「添加」或回车
3. 每行可编辑或点击「删除」移除

## 打包为 VSIX

```bash
npm run package
```

会在项目根目录生成 `exclude-manager-0.1.0.vsix`。在 VS Code/Cursor 中：**扩展** → 右上角 **⋯** → **从 VSIX 安装**，选择该文件即可安装。

若要将插件发布到 [VS Code 扩展商店](https://marketplace.visualstudio.com/) 供所有人安装，请参阅 [docs/PUBLISH.md](docs/PUBLISH.md)。

## 开发与调试

```bash
npm install
npm run compile
```

在 VS Code/Cursor 中按 F5 启动扩展开发主机，即可在侧边栏看到「Exclude Manager」并测试添加/删除/编辑。
