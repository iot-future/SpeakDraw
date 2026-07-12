# MyFreeProject

> TypeScript 全栈应用 | React + Node.js | Monorepo

## 技术栈

- **前端**: React 18+ / Next.js + TypeScript
- **后端**: Node.js + TypeScript
- **包管理**: pnpm monorepo
- **测试**: Vitest
- **代码质量**: ESLint + Prettier

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发环境
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

## 项目结构

```
packages/
├── server/    # 后端服务
├── web/       # 前端应用
└── shared/    # 共享类型/工具
docs/
├── prd/       # 产品需求文档
├── design/    # 技术方案文档
├── api/       # API 文档
└── changelog/ # 变更日志
```

详见 [CODEBUDDY.md](./CODEBUDDY.md) 和 [.codebuddy/rules/](./.codebuddy/rules/)。

## 开发规范

- [项目结构规范](./.codebuddy/rules/project-structure/RULE.mdc)
- [编码规范](./.codebuddy/rules/coding-standards/RULE.mdc)
- [Git 工作流](./.codebuddy/rules/git-workflow/RULE.mdc)
- [文档规范](./.codebuddy/rules/documentation/RULE.mdc)
- [测试规范](./.codebuddy/rules/testing/RULE.mdc)
