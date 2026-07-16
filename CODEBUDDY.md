# CODEBUDDY.md

> SpeakDraw 项目指令。CodeBuddy 会自动加载本文件到每个会话。

## 环境关键事实

- **pnpm 需要 Node ≥ 22.13**，系统默认 `node` 可能为旧版本。执行 pnpm/tsc/test 前切换：
  ```bash
  export PATH="/Users/zzm/.nvm/versions/node/v22.23.1/bin:$PATH"
  ```
- 项目根目录 `package.json` engines 要求 node>=20

## 常用命令

```bash
pnpm build          # 编译全部 5 个子包
pnpm test           # 运行全部测试
pnpm lint           # ESLint 检查
pnpm test:release   # 发布门禁（build + ESM 校验 + 烟雾测试）
```

## 发布门禁注意事项

`pnpm test:release` 依赖两个本地脚本（不入 git）：

| 脚本                       | 用途                            |
| -------------------------- | ------------------------------- |
| `scripts/validate-esm.mjs` | ESM 模块解析校验（4 项检查）    |
| `scripts/smoke-test.mjs`   | 编译产物运行时烟雾测试（10 项） |

**⚠️ 切分支后务必检查**：这两个脚本在 `.gitignore` 中，`git checkout` 切换分支时可能丢失。如果 `pnpm test:release` 报 `MODULE_NOT_FOUND`，从 git 历史恢复：

```bash
git show c88ea87:scripts/validate-esm.mjs > scripts/validate-esm.mjs
```

> `smoke-test.mjs` 通常保留在本地不会被误删，但 `validate-esm.mjs` 因其在 `.gitignore` 中且未缓存，切分支后可能丢失。
