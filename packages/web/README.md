# @ai-diagram/web — Web UI

## 职责

为 AI-Diagram 提供 Web 界面：对话式图表生成 + draw.io 嵌入预览 + 客户端导出。
BYOK（API Key 存浏览器 localStorage），服务端零状态。

## 目录结构

| 路径                                 | 角色                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `server/`                            | Express API server，封装 `@ai-diagram/core` 并提供 LLM 代理 |
| `server/index.ts`                    | Server 入口，挂载路由 + 中间件                              |
| `server/config.ts`                   | 服务端配置（端口、CORS）                                    |
| `server/middleware/error-handler.ts` | 全局错误处理（AppError → HTTP 状态码）                      |
| `server/routes/health.ts`            | GET /api/health — 健康检查                                  |
| `server/routes/session.ts`           | Session CRUD（内存存储）                                    |
| `server/routes/generate.ts`          | POST /api/generate — 全链路生成（LLM→IR→Layout→XML）        |
| `server/routes/validate.ts`          | POST /api/validate — 静态几何校验                           |
| `server/routes/layout.ts`            | POST /api/layout — IR → 布局 + 序列化                       |
| `server/routes/proxy/llm-proxy.ts`   | POST /api/proxy/llm — 浏览器直连 LLM API 的代理             |
| `src/`                               | React SPA 前端                                              |
| `src/App.tsx`                        | 根组件，路由配置                                            |
| `src/main.tsx`                       | ReactDOM.createRoot 入口                                    |
| `src/components/Header.tsx`          | 顶栏：Logo + 主题切换 + 设置入口                            |
| `src/components/Layout.tsx`          | 页面外壳                                                    |
| `src/components/ChatPanel/`          | 左侧对话面板                                                |
| `src/components/PreviewPanel/`       | 右侧预览面板 + draw.io embed                                |
| `src/components/Settings/`           | 设置弹窗（API Key / Provider / Model）                      |
| `src/components/common/`             | 通用 UI 组件（Button / Modal / Select / Spinner）           |
| `src/pages/HomePage.tsx`             | 主页（ChatPanel + PreviewPanel 双栏）                       |
| `src/pages/SettingsPage.tsx`         | 独立设置页                                                  |
| `src/pages/PreviewPage.tsx`          | 纯预览页（供 MCP Server 跳转）                              |
| `src/services/api-client.ts`         | fetch 封装（Base URL + 错误处理）                           |
| `src/services/core-bridge.ts`        | 核心 API 调用的类型化封装                                   |
| `src/stores/config-store.ts`         | Zustand store（API Key / Provider / Theme → localStorage）  |
| `src/stores/session-store.ts`        | Zustand store（会话 / 消息 / XML）                          |
| `src/hooks/useGenerate.ts`           | 生成流程 Hook（调用 API → 更新 store → 更新步骤）           |
| `src/hooks/useDrawioEmbed.ts`        | draw.io embed postMessage 通信 Hook                         |
| `src/hooks/useTheme.ts`              | 暗色模式 Hook                                               |
| `src/types/chat.ts`                  | 前端类型定义（ChatMessage / StepState）                     |
| `src/utils/download.ts`              | 浏览器下载 / 剪贴板工具函数                                 |

## 架构

```
Browser (React SPA)
    │
    ├── Vite Dev Server (port 3000) ──proxy──▶ Express API Server (port 3001)
    │                                              │
    │                                              ├── Session Manager (in-memory Map)
    │                                              ├── @ai-diagram/core (layout/serialize/validate)
    │                                              └── LLM Proxy (fetch → OpenAI/Anthropic/DeepSeek/Hunyuan)
    │
    └── draw.io Embed (iframe postMessage)
```

## 对外 API

| 端点                | 方法   | 说明                             |
| ------------------- | ------ | -------------------------------- |
| `/api/health`       | GET    | 健康检查                         |
| `/api/sessions`     | POST   | 创建 session                     |
| `/api/sessions/:id` | GET    | 获取 session 详情                |
| `/api/sessions/:id` | DELETE | 删除 session                     |
| `/api/generate`     | POST   | 全链路生成（text → draw.io XML） |
| `/api/validate`     | POST   | 静态几何校验                     |
| `/api/layout`       | POST   | IR → 布局 + XML                  |
| `/api/proxy/llm`    | POST   | LLM API 代理                     |

## 页面路由

| 路由                  | 说明                  |
| --------------------- | --------------------- |
| `/`                   | 主页：对话生成 + 预览 |
| `/settings`           | 设置页                |
| `/preview/:sessionId` | 纯预览页（MCP 集成）  |

## 依赖关系

- `@ai-diagram/core`（服务端：布局 / 序列化 / 校验）
- `@ai-diagram/shared`（类型 + Schema）
- 不依赖 `@ai-diagram/mcp-server` 或 `ai-diagram`（CLI）

## 开发命令

```bash
pnpm dev          # 启动 Vite + Express（并行）
pnpm dev:client   # 仅前端
pnpm dev:server   # 仅后端
pnpm build        # 构建
pnpm test         # 运行测试
```

## 配置项

| 环境变量       | 默认值                  | 说明                         |
| -------------- | ----------------------- | ---------------------------- |
| `SERVER_PORT`  | `3001`                  | API Server 端口              |
| `CORS_ORIGINS` | `http://localhost:3000` | 允许的 CORS 来源（逗号分隔） |

## 已知限制

- Session 数据不持久化（进程重启丢失，与 Step 6 MCP Server 一致）
- draw.io embed 依赖 `embed.diagrams.net`（需网络连接）
- PNG/SVG 导出通过 draw.io embed API，受限于 embed 的导出能力
- 大图（>50 节点）在 embed viewer 中渲染可能变慢
