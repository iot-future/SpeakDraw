# CLI 交付形态

## 职责

提供 `ai-diagram` 命令行工具，让用户在终端通过一条命令完成"文本 → 图文件"的全流程，复用核心库 `@ai-diagram/core` 的纯函数 API。

## 目录结构

| 文件                          | 角色                                                     |
| ----------------------------- | -------------------------------------------------------- |
| `src/index.ts`                | Commander 程序入口，挂载 4 个子命令                      |
| `src/config.ts`               | 配置加载器（env + `ai-diagram.config.json` + CLI flags） |
| `src/commands/generate.ts`    | `generate` 命令：文本→IR→ELK→XML→文件 全链路             |
| `src/commands/validate.ts`    | `validate` 命令：静态几何校验                            |
| `src/commands/export.ts`      | `export` 命令：PNG/SVG 导出（Phase 3 占位）              |
| `src/commands/layout-only.ts` | `layout-only` 命令：IR JSON→布局→XML                     |
| `src/utils/logger.ts`         | 日志/输出工具（spinner/progress/verbose/quiet）          |

## 对外接口

本模块为 CLI 入口，不暴露 API 给其他模块调用。所有命令通过 Commander 注册，核心逻辑委托给 `@ai-diagram/core`。

## 依赖关系

- **依赖**: `@ai-diagram/core`（核心库全部公共 API）、`@ai-diagram/shared`（类型/schema）
- **被依赖**: 无（CLI 是终端交付层）

## 数据流

```
CLI flags ─┐
环境变量 ──┼────→ loadConfig() → CliConfig
   .env ───┘

用户输入（文本/文件）→ [generate]
                      ├── textToIR(text) → IRDiagram
                      ├── layoutDiagram(ir) → LayoutResult
                      └── serializeToFile(ir, layout, path) → .drawio

.drawio 文件 → [validate]
               ├── readFile → XML
               └── StaticValidator.validate(xml) → ValidationReport

IR JSON 文件 → [layout-only]
               ├── readFile + irDiagramSchema.parse → IRDiagram
               ├── layoutDiagram(ir) → LayoutResult
               └── serializeToFile(ir, layout, path) → .drawio
```

## 配置项

| 配置键    | 环境变量                | CLI flag         | 默认值   | 说明         |
| --------- | ----------------------- | ---------------- | -------- | ------------ |
| provider  | `AI_DIAGRAM_PROVIDER`   | `-p/--provider`  | `openai` | LLM provider |
| model     | `AI_DIAGRAM_MODEL`      | `-m/--model`     | 无       | 具体模型名   |
| outputDir | `AI_DIAGRAM_OUTPUT_DIR` | `-o/--output`    | `.`      | 输出目录     |
| direction | `AI_DIAGRAM_DIRECTION`  | `-d/--direction` | `LR`     | 布局方向     |

API Key 按 provider 从对应环境变量读取：

| Provider  | 环境变量            |
| --------- | ------------------- |
| openai    | `OPENAI_API_KEY`    |
| anthropic | `ANTHROPIC_API_KEY` |
| deepseek  | `DEEPSEEK_API_KEY`  |
| hunyuan   | `HUNYUAN_API_KEY`   |

## 退出码规范

| 码  | 含义            |
| --- | --------------- |
| 0   | 成功            |
| 1   | 参数错误        |
| 2   | LLM 服务不可达  |
| 3   | Schema 校验失败 |
| 4   | 几何校验冲突    |

## 已知限制

- PNG/SVG 导出为 Phase 3 占位（当前仅提示用户用 draw.io 手动导出）
- 不支持 DeepSeek/Hunyuan Provider（核心库 `provider-factory.ts` 的 registry 中尚未注册，需先实现对应 adapter）

## 常见问题

**Q: 如何安装？**
A: `pnpm add ./packages/cli` 或全局安装后 `ai-diagram generate "..."`

**Q: 如何查看帮助？**
A: `ai-diagram --help` 或 `ai-diagram generate --help`
