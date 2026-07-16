<div align="center">
  <h1>SpeakDraw</h1>
  <p><strong>Speak your diagram into existence</strong></p>
  <p>
    An intelligent diagramming tool powered by LLM semantic understanding + ELK automatic layout.<br/>
    Available as CLI, MCP Server, and Web UI — outputting standard draw.io format.
  </p>
</div>

<p align="center">
  <strong>English</strong> | <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## Features

| Feature                 | Description                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Natural Language Input  | Describe your diagram in plain Chinese or English — entities, attributes, and relationships are automatically extracted |
| Multi-Model Support     | OpenAI, Anthropic, DeepSeek, Hunyuan — bring your own API key                                                           |
| Automatic Layout        | Topology layout via ELK algorithm with orthogonal routing, groups, and swimlanes                                        |
| Geometry Validation     | 5 static geometry checks with auto-fix (overlap / edge-through-node / orphan / crossing / overflow)                     |
| Multi-Form Delivery     | CLI / MCP Server / Web UI — same core engine                                                                            |
| Extensible Architecture | Ports & Adapters pattern — add a new LLM Provider by implementing a single interface                                    |

## Quick Start

### Requirements

- **Node.js** ≥ 20.0
- **pnpm** ≥ 9.0

```bash
# Install dependencies & build
pnpm install && pnpm build

# Web UI
cd packages/web
node dist-server/server/index.js &   # API Server → http://localhost:3001
npx serve dist -l 3000              # Frontend → http://localhost:3000

# CLI
node packages/cli/dist/index.js generate "A user registration system with users, orders, and products"

# MCP Server (for Claude / CodeBuddy)
node packages/mcp-server/dist/index.js
```

> **Note**: LLM features require an API key (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / etc.). Configure via Web UI settings or environment variables.

### MCP Server Configuration

SpeakDraw's MCP Server exposes **14 tools** via stdio transport, compatible with any MCP-compatible client (Claude Desktop, CodeBuddy, Continue, Cursor, etc.).

#### Connect to Your MCP Client

Add the following to your MCP client's configuration file:

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "speakdraw": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server/dist/index.js"]
    }
  }
}
```

**CodeBuddy** (`.codebuddy/mcp.json`):

```json
{
  "mcpServers": {
    "speakdraw": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

#### Zero-API-Key Mode (Recommended)

The recommended workflow requires **no LLM API key** on the server side:

1. Your AI client reads the tool descriptions and understands the `IRDiagram` JSON schema
2. The client's own LLM constructs an `IRDiagram` JSON with entities, relationships, and attributes
3. Pass it to `generate_diagram({ ir: {...} })` — the MCP server handles layout, styling, and validation

This is the **zero-key mode** — the MCP server only does layout + serialization.

#### Description Mode (Fallback)

If your AI client cannot construct `IRDiagram` JSON, you can use the natural language mode:

```json
{
  "mcpServers": {
    "speakdraw": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "LLM_PROVIDER": "openai"
      }
    }
  }
}
```

| Env Variable        | Description                                                    | Required                            | Default  |
| ------------------- | -------------------------------------------------------------- | ----------------------------------- | -------- |
| `OPENAI_API_KEY`    | OpenAI API Key                                                 | IR mode: No / Description mode: Yes | —        |
| `ANTHROPIC_API_KEY` | Anthropic API Key                                              | IR mode: No / Description mode: Yes | —        |
| `LLM_PROVIDER`      | LLM provider (`openai` / `anthropic` / `deepseek` / `hunyuan`) | No                                  | `openai` |

#### Available Tools

| Tool                                       | Description                                              |
| ------------------------------------------ | -------------------------------------------------------- |
| `start_session`                            | Start a diagram session, returns sessionId + preview URL |
| `generate_diagram`                         | Generate diagram from IR JSON or natural language        |
| `get_diagram`                              | Get current XML and cell state                           |
| `edit_diagram`                             | Atomic edit operations (add/update/delete)               |
| `validate_diagram`                         | Static geometry validation (5 checks)                    |
| `smart_fix`                                | Auto-fix geometry conflicts                              |
| `export_diagram`                           | Export `.drawio` file                                    |
| `list_pages`                               | List all pages with metadata                             |
| `add_page` / `rename_page` / `delete_page` | Page management                                          |
| `auto_layout`                              | Re-run ELK layout on existing topology                   |
| `find_cells`                               | Search cells by keyword/type                             |
| `apply_theme`                              | Apply a predefined theme                                 |

Once configured, restart your MCP client and start a session:

```
Start a SpeakDraw diagram session for me
```

## Architecture

```
packages/
├── shared/       # Shared contracts — IR Schema (Zod), types, constants
├── core/         # Core engine — LLM extraction / ELK layout / styling & serialization / validation
├── cli/          # CLI tool — commander + chalk
├── mcp-server/   # MCP Server — 14 tools, stdio transport
└── web/          # Web UI — Vite + React 18 + Express API + draw.io embed
```

**Core Pipeline**: `Text → LLM Extraction → IR → ELK Layout → Style Serialization → draw.io XML`

Architecture: **Ports & Adapters (Hexagonal)** — zero framework dependencies in the core layer.

## Packages

| Path                  | Package                 | Description                                                        |
| --------------------- | ----------------------- | ------------------------------------------------------------------ |
| `packages/shared`     | `@speakdraw/shared`     | Shared types, IR schemas, validation rules                         |
| `packages/core`       | `@speakdraw/core`       | Core engine: LLM extraction, ELK layout, serialization, validation |
| `packages/cli`        | `speakdraw`             | CLI tool: `generate` / `validate` / `export` / `layout-only`       |
| `packages/mcp-server` | `@speakdraw/mcp-server` | MCP Server: 14 tools for MCP-compatible clients                    |
| `packages/web`        | `@speakdraw/web`        | Web UI: SPA + API Server with embedded draw.io editor              |

## Extension Points

Designed with the **Open-Closed Principle** — extension points isolated behind interfaces:

| Extension Point    | Location                     | Implementations                             |
| ------------------ | ---------------------------- | ------------------------------------------- |
| LLM Provider       | `core/src/llm/ports/`        | OpenAI, Anthropic                           |
| Geometry Validator | `core/src/validation/ports/` | Static AABB + line-segment analysis         |
| Style Templates    | `core/src/styling/`          | 8 node types + 6 edge types + 3 group types |

> Adding a Provider: implement interface → register → add tests. Zero changes to existing code.

## Development

```bash
pnpm install       # Install dependencies
pnpm lint          # Lint check
pnpm test          # Run tests
pnpm test:coverage # Coverage report
pnpm build         # Build / type-check
pnpm format        # Format code
```

### Conventions

- **Stack**: TypeScript 5+ strict, pnpm monorepo, Vitest, ESLint + Prettier
- **Architecture**: SOLID, Ports & Adapters, DI, Open-Closed Principle
- **Workflow**: Docs-first (PRD → Design → Code), TDD, Conventional Commits
- **Gates**: type-check + lint + coverage ≥ 80% + no dead code / hardcoded secrets

## License

MIT License

---

<div align="center">
  <sub>Built with ❤️</sub>
</div>
