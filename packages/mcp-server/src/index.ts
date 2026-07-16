#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from './session/session-manager.js';
import { PreviewServer } from './preview/preview-server.js';
import { toolDefinitions, toolHandlers } from './tools/registry.js';

async function main(): Promise<void> {
  const sessionManager = new SessionManager({ maxSessions: 10 });
  const previewServer = new PreviewServer();

  await previewServer.start(sessionManager);

  process.stderr.write(
    '┌─────────────────────────────────────────────┐\n' +
      '│  🎨 SpeakDraw MCP Server v0.2.2            │\n' +
      '│  等待 MCP 客户端连接（stdio 协议）            │\n' +
      '│                                             │\n' +
      '│  预览服务: http://localhost:3000             │\n' +
      '│  提示: 本进程由 MCP 客户端管理，请勿手动关闭    │\n' +
      '│        Ctrl+C 可安全退出                      │\n' +
      '└─────────────────────────────────────────────┘\n',
  );

  const server = new Server(
    { name: 'speakdraw-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toolDefinitions,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = toolHandlers[name];
    if (!handler) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
        isError: true,
      };
    }
    try {
      const result = await handler(args ?? {}, sessionManager, previewServer);
      return {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      };
    } catch (err: unknown) {
      process.stderr.write(
        `[mcp-server] tool "${name}" error: ${err instanceof Error ? err.message : 'unknown'}\n`,
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Tool execution failed', code: 'TOOL_ERROR' }),
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
  } catch (err: unknown) {
    await previewServer.stop();
    throw err;
  }

  process.on('SIGINT', async () => {
    await previewServer.stop();
    await server.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await previewServer.stop();
    await server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  process.stderr.write(`MCP Server fatal: ${err instanceof Error ? err.message : 'unknown'}\n`);
  process.exit(1);
});
