import type { SessionManager } from './session/session-manager.js';
import type { PreviewServer } from './preview/preview-server.js';

export type ToolResult = Record<string, unknown>;

export type ToolHandler = (
  args: Record<string, unknown>,
  sessionManager: SessionManager,
  previewServer: PreviewServer,
) => Promise<ToolResult>;
