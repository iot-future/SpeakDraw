<div align="center">
  <h1>SpeakDraw</h1>
  <p><strong>你说，我画 —— 自然语言驱动的智能画图工具</strong></p>
  <p>
    基于 LLM 语义理解 + ELK 自动布局的智能图表生成引擎。<br/>
    支持 CLI / MCP Server / Web UI 三种交付形态，输出标准 draw.io 格式。
  </p>
</div>

<p align="center">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</p>

---

## 特性

| 特性         | 说明                                                                 |
| ------------ | -------------------------------------------------------------------- |
| 自然语言输入 | 用中文或英文描述图表，实体、属性、关系自动提取                       |
| 多模型支持   | OpenAI、Anthropic、DeepSeek、Hunyuan，自带 API Key                   |
| 自动布局     | ELK 算法拓扑布局，支持正交路由、分组、泳道                           |
| 几何校验     | 5 项静态几何检查 + 自动修复（重叠 / 穿节点 / 孤立 / 交叉 / 溢出）    |
| 多形态交付   | CLI / MCP Server / Web UI，共享同一核心引擎                          |
| 可扩展架构   | 端口适配器模式 —— 新增 LLM Provider 只需实现一个接口，不改一行旧代码 |

## 快速开始

### 环境要求

- **Node.js** ≥ 20.0
- **pnpm** ≥ 9.0

```bash
# 安装依赖并构建
pnpm install && pnpm build

# Web UI
cd packages/web
node dist-server/server/index.js &   # API 服务 → http://localhost:3001
npx serve dist -l 3000              # 前端 → http://localhost:3000

# CLI
node packages/cli/dist/index.js generate "一个包含用户、订单和商品的用户注册系统"

# MCP Server（供 Claude / CodeBuddy 使用）
node packages/mcp-server/dist/index.js
```

> **注意**：LLM 功能需要 API Key（`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` 等），通过 Web UI 设置或环境变量配置。

## 架构

```
packages/
├── shared/       # 共享契约 —— IR Schema（Zod）、类型、常量
├── core/         # 核心引擎 —— LLM 提取 / ELK 布局 / 样式序列化 / 校验
├── cli/          # 命令行工具 —— commander + chalk
├── mcp-server/   # MCP 服务 —— 14 个工具，stdio 传输
└── web/          # Web 界面 —— Vite + React 18 + Express API + draw.io 内嵌
```

**核心管线**：`文本 → LLM 提取 → IR → ELK 布局 → 样式序列化 → draw.io XML`

架构模式：**端口适配器（六边形架构）**—— 核心层零框架依赖。

## 包列表

| 路径                  | 包名                    | 说明                                                   |
| --------------------- | ----------------------- | ------------------------------------------------------ |
| `packages/shared`     | `@speakdraw/shared`     | 共享类型、IR 校验规则                                  |
| `packages/core`       | `@speakdraw/core`       | 核心引擎：LLM 提取、ELK 布局、序列化、校验             |
| `packages/cli`        | `speakdraw`             | 命令行工具：generate / validate / export / layout-only |
| `packages/mcp-server` | `@speakdraw/mcp-server` | MCP 服务：14 个工具，支持 MCP 兼容客户端               |
| `packages/web`        | `@speakdraw/web`        | Web 界面：SPA + API Server + 内嵌 draw.io 编辑器       |

## 扩展点

遵循**开闭原则（OCP）**设计 —— 扩展点以接口隔离：

| 扩展点       | 路径                         | 已实现                       |
| ------------ | ---------------------------- | ---------------------------- |
| LLM Provider | `core/src/llm/ports/`        | OpenAI, Anthropic            |
| 几何校验器   | `core/src/validation/ports/` | 静态 AABB + 线段分析         |
| 样式模板     | `core/src/styling/`          | 8 种节点 + 6 种边 + 3 种容器 |

> 新增 Provider：实现接口 → 注册 → 加测试。不改动已有代码。

## 开发

```bash
pnpm install       # 安装依赖
pnpm lint          # 代码检查
pnpm test          # 运行测试
pnpm test:coverage # 覆盖率报告
pnpm build         # 构建 / 类型检查
pnpm format        # 格式化代码
```

### 约定

- **技术栈**：TypeScript 5+ strict、pnpm monorepo、Vitest、ESLint + Prettier
- **架构**：SOLID、端口适配器、依赖注入、开闭原则
- **工作流**：文档先行（PRD → 方案 → 编码）、TDD、Conventional Commits
- **门禁**：类型检查 + lint + 覆盖率 ≥ 80% + 无死代码/硬编码密钥

## 许可证

MIT License

---

<div align="center">
  <sub>Built with ❤️</sub>
</div>
