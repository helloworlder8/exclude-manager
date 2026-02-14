# 将 Exclude Manager 发布到 VS Code 扩展商店

## 一、前置条件

1. **Microsoft 账号**  
   用于登录 [Visual Studio Marketplace](https://marketplace.visualstudio.com/) 和 Azure DevOps。

2. **创建 Publisher（发布者）**  
   - 打开：<https://marketplace.visualstudio.com/manage>  
   - 用 Microsoft 账号登录  
   - 点击 **Create Publisher**，填写：
     - **Publisher ID**：唯一标识，例如 `your-username` 或 `exclude-manager`（一旦创建不可改）
     - **Display name**：显示名称  
     - 其他信息按需填写  
   - 创建后记下你的 **Publisher ID**，后面会用到。

3. **Azure DevOps 个人访问令牌（PAT）**  
   - 打开：<https://dev.azure.com> → 右上角用户头像 → **Personal access tokens**  
   - 或直接：<https://dev.azure.com/_usersSettings/tokens>  
   - 点击 **+ New Token**：
     - Name：随意，如 `vsce-publish`
     - Organization：选 **All accessible organizations** 或你的组织
     - Expiration：建议 90 天或自定义
     - Scopes：勾选 **Custom defined** → 只勾选 **Marketplace** → **Manage**
   - 创建后**立即复制并保存**令牌（只显示一次）。

---

## 二、完善 package.json

发布前需要：

1. **使用你的 Publisher ID**  
   把 `package.json` 里的 `"publisher": "exclude-manager"` 改成你在第一步创建的 **Publisher ID**（例如 `"your-username"`）。

2. **填写仓库地址（推荐）**  
   若代码在 GitHub 等托管，在 `package.json` 根级增加：

   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/你的用户名/exclude-manager.git"
   }
   }
   ```

   或简短形式：`"repository": "https://github.com/你的用户名/exclude-manager"`

3. **可选：LICENSE**  
   在项目根目录放一个 `LICENSE` 或 `LICENSE.md`（如 MIT），扩展商店会显示为开源。

---

## 三、本地发布

在项目根目录执行：

```bash
# 1. 登录（只需做一次，或 PAT 过期时重做）
npx @vscode/vsce login 你的PublisherID

# 按提示粘贴刚才复制的 Personal Access Token

# 2. 发布
npx @vscode/vsce publish
```

首次发布会要求同意条款；之后每次更新版本只需改 `package.json` 里的 `version`，再执行 `npx @vscode/vsce publish`。

---

## 四、发布方式说明

- **`publish`**：发布到 VS Code 扩展市场，所有人可搜索安装。  
- **`package`**：只打 VSIX，不发布（你当前用的 `npm run package` 就是这种）。

---

## 五、发布后

- 扩展会出现在：<https://marketplace.visualstudio.com/>  
- 用户可在 VS Code / Cursor 里搜索 “Exclude Manager” 安装。  
- 更新版本：改 `version` → 再执行一次 `npx @vscode/vsce publish`。

---

## 六、常见问题

- **“Error: Missing publisher”**：检查 `package.json` 的 `publisher` 是否与你在 marketplace 创建的 Publisher ID 完全一致。  
- **“Invalid resource”**：确认 PAT 创建时勾选了 **Marketplace → Manage**。  
- **版本号**：每次发布新版本，`version` 必须大于上一次（如 `0.1.0` → `0.1.1`）。
