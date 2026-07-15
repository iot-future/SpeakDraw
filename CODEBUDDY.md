# SpeakDraw - 工程规范总则

## 项目概要

TypeScript 全栈应用，个人项目。自然语言 → draw.io 专业图表工具，支持 CLI / MCP Server / Web UI 三种交付形态。

## 强制约束（所有 AI 会话必须遵守）

### 0. 规则优先级

1. 用户显式指令（最高）
2. 本文件及 `.codebuddy/rules/` 中的项目规则
3. AI 默认行为（最低）
   发生冲突时按上述优先级裁决。

### 1. 变更前必须读规范

任何代码修改前，先阅读本文件及相关 rule 文件，确认当前约定。**规则是唯一一致性来源。**

### 2. 文档先行（规格驱动）

- 新功能：PRD（`docs/prd/`）→ 技术方案（`docs/design/`）→ 测试 → 编码
- 选型 / 破坏兼容 / 新扩展点机制：先写 ADR（`docs/adr/`）
- Bug：issue 描述 → 修复 → 更 CHANGELOG

### 3. 测试驱动（TDD 强制）

- 新功能/接口：先写失败测试 → 实现 → 重构；无测试不提交 production code
- 覆盖率门禁：行/分支 ≥ 80%，业务逻辑/端口 ≥ 90%

### 4. 扩展点优先（OCP）

- 任何"未来可能多种实现"的能力，先定义 `ports/` 接口，实现放 `adapters/`
- 新增实现 = 新增文件，不改动已有调用方
- 所有 ports 登记到 `docs/EXTENSION_POINTS.md`

### 5. 提交与版本

- Conventional Commits；一个 commit 一件事
- SemVer：破坏公共契约 = major（需 ADR + CHANGELOG `BREAKING`）
- 提交前 lint + test + 覆盖率 + 自查清单全过

### 6. 完成前验证（Verify Before Done）

声明完成前必须：lint 通过、测试通过、构建通过、无 console.log/死代码/硬编码密钥、新 API 有 JSDoc、新 ports 已登记。

### 7. 代码审查与范围纪律

- 即使个人项目，写完自查 diff（无 console.log、死代码、密钥）
- 需求歧义 / 影响扩展性的设计选择 → **停下询问**，不臆测
- 禁止静默扩大范围；不顺手改无关模块；新依赖需说明理由

## 技术栈约定

| 层           | 技术                               | 状态                     |
| ------------ | ---------------------------------- | ------------------------ |
| 前端框架     | React 18+ / Next.js                | 待定备选                 |
| 后端框架     | Express / Fastify / Hono           | **未定，藏 ports 后**    |
| 语言         | TypeScript 5+（strict + 额外开关） | 固定                     |
| 包管理       | pnpm + monorepo                    | 固定                     |
| 测试         | Vitest                             | 固定                     |
| 代码风格     | ESLint + Prettier                  | 固定                     |
| 数据库 / ORM | 待定                               | **未定，藏 adapters 后** |

> 未定技术必须被 `ports/`/`adapters/` 隔离，替换时不波及核心逻辑。

## 详细规范索引（8 项）

| 规范                                    | 文件                                                  |
| --------------------------------------- | ----------------------------------------------------- |
| 项目结构 / 扩展点布局                   | `.codebuddy/rules/project-structure/RULE.mdc`         |
| 编码规范（SOLID / 错误契约 / 日志）     | `.codebuddy/rules/coding-standards/RULE.mdc`          |
| 架构（端口适配器 / DI / 兼容）          | `.codebuddy/rules/architecture/RULE.mdc`              |
| 测试（TDD / 契约测试 / 覆盖率）         | `.codebuddy/rules/testing/RULE.mdc`                   |
| 文档（PRD / ADR / API 版本 / 扩展点表） | `.codebuddy/rules/documentation/RULE.mdc`             |
| Git 工作流（SemVer / PR / Changelog）   | `.codebuddy/rules/git-workflow/RULE.mdc`              |
| 安全（校验 / 密钥 / 注入 / 鉴权）       | `.codebuddy/rules/security/RULE.mdc`                  |
| AI 开发治理（规格驱动 / 验证 / 范围）   | `.codebuddy/rules/ai-development-governance/RULE.mdc` |

## 文档体系

```
docs/
├── prd/  design/  api/  adr/  EXTENSION_POINTS.md  changelog/
```

## 快速命令

```bash
pnpm install          # 安装依赖
pnpm lint             # 代码检查
pnpm test -- --coverage # 测试 + 覆盖率门禁
pnpm build            # 构建 / 类型检查
```
