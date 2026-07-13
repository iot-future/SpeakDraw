# @ai-diagram/mcp-server

## 职责

MCP Server 将 AI-Diagram 核心能力暴露为 MCP 工具，让 AI Agent 通过自然语言生成、编辑、校验和导出图表。

## 目录结构

```
packages/mcp-server/src/
├── index.ts              # MCP Server 入口（stdio transport）
├── mcp-types.ts          # 共享 MCP 类型
├── session/
│   ├── session-manager.ts  # 会话管理器（内存存储）
│   └── session.types.ts    # 会话类型定义
├── preview/
│   ├── preview-server.ts   # 预览 HTTP 服务器
│   ├── embed-template.ts   # diagrams.net embed HTML 模板
│   └── preview.types.ts    # 预览类型
└── tools/
    ├── registry.ts         # 工具注册表（定义 + 处理器映射）
    ├── start-session.ts    # start_session 工具
    ├── generate-diagram.ts # generate_diagram 工具
    ├── get-diagram.ts      # get_diagram 工具
    ├── edit-diagram.ts     # edit_diagram 工具
    ├── validate-diagram.ts # validate_diagram 工具
    ├── smart-fix.ts        # smart_fix 工具
    ├── export-diagram.ts   # export_diagram 工具
    ├── list-pages.ts       # list_pages 工具
    ├── page-tools.ts       # add_page / rename_page / delete_page
    ├── auto-layout.ts      # auto_layout 工具
    ├── find-cells.ts       # find_cells 工具
    └── apply-theme.ts      # apply_theme 工具
```

## 工具清单（14 个）

### P0 核心工具

| 工具               | 功能                                      | 输入                          | 输出                                                                          |
| ------------------ | ----------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `start_session`    | 启动图表会话，返回 sessionId + previewUrl | `{ title? }`                  | `{ sessionId, previewUrl }`                                                   |
| `generate_diagram` | 自然语言→IR→ELK→XML 全链路生成            | `{ description, sessionId? }` | `{ sessionId, diagramId, type, nodeCount, edgeCount, previewUrl, conflicts }` |
| `get_diagram`      | 获取当前 XML + cells 状态                 | `{ sessionId }`               | `{ xml, cells, pageCount }`                                                   |
| `edit_diagram`     | 原子操作（add/update/delete）修改图表     | `{ sessionId, operations[] }` | `{ success, changes, errors? }`                                               |
| `validate_diagram` | 静态几何校验                              | `{ sessionId, tolerance? }`   | `{ passed, conflicts }`                                                       |
| `smart_fix`        | 自动修复几何冲突                          | `{ sessionId, maxRounds? }`   | `{ fixed, remaining, rounds }`                                                |
| `export_diagram`   | 导出 .drawio 文件                         | `{ sessionId, format? }`      | `{ filePath, format }`                                                        |
| `list_pages`       | 列出所有页面                              | `{ sessionId }`               | `{ pages }`                                                                   |

### P1 增强工具

| 工具          | 功能                        |
| ------------- | --------------------------- |
| `add_page`    | 追加新页面                  |
| `auto_layout` | 对已有拓扑重新执行 ELK 布局 |
| `find_cells`  | 按关键词/类型搜索 cell      |

### P2 锦上添花

| 工具          | 功能                       |
| ------------- | -------------------------- |
| `rename_page` | 重命名页面                 |
| `delete_page` | 删除页面（拒绝删最后一页） |
| `apply_theme` | 套用预定义主题（占位）     |

## 依赖关系

- 依赖：`@ai-diagram/core`，`@ai-diagram/shared`，`@modelcontextprotocol/sdk`
- 被依赖：无（终端交付层）

## 数据流

```
MCP Client (AI Agent)
  │
  │ stdio (JSON-RPC)
  ▼
MCP Server
  ├── start_session  → SessionManager.createSession() → PreviewServer
  ├── generate_diagram → core.textToIR() → core.layoutDiagram() → core.serialize()
  │                   → SessionManager.updateSession(xml) → StaticValidatorImpl
  ├── get_diagram    → SessionManager.getSession()
  ├── edit_diagram   → SessionManager.getSession() → cells mutation → re-layout → updateSession()
  ├── validate_diagram → StaticValidatorImpl.validate(xml)
  ├── smart_fix      → core.smartFix(xml, validator, options) → 重新校验
  ├── export_diagram → fs.writeFile(xml)
  └── page_tools     → SessionManager.getSession().pages mutation
```

## 配置

| 环境变量            | 说明              | 默认值   |
| ------------------- | ----------------- | -------- |
| `LLM_PROVIDER`      | LLM 服务商        | `openai` |
| `OPENAI_API_KEY`    | OpenAI API Key    | -        |
| `ANTHROPIC_API_KEY` | Anthropic API Key | -        |

## 开发

```bash
pnpm --filter @ai-diagram/mcp-server build
pnpm --filter @ai-diagram/mcp-server test
pnpm --filter @ai-diagram/mcp-server test:watch
```

## MCP Client 配置

在 Claude Desktop / CodeBuddy 等 MCP 客户端中添加：

```json
{
  "mcpServers": {
    "ai-diagram": {
      "command": "node",
      "args": ["packages/mcp-server/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-xxx"
      }
    }
  }
}
```

## 已知限制

- Session 数据仅存内存，进程重启后丢失
- `export_diagram` 仅支持 `.drawio` 格式，PNG/SVG 待 Phase 3
- `apply_theme` 为占位实现，完整外观变化待 Phase 3
- `edit_diagram` 后重布局可能改变坐标，不支持增量坐标编辑
- 最多 10 个并发 session
- Preview 依赖外部 `embed.diagrams.net`（需网络连接）
