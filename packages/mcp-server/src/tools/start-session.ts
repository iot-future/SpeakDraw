import type { ToolHandler } from '../mcp-types.js';

export const startSessionHandler: ToolHandler = async (args, sessionManager, previewServer) => {
  const title = (args['title'] as string) ?? 'Untitled';
  const session = sessionManager.createSession(title);
  const previewUrl = previewServer.getPreviewUrl(session.id);
  return { sessionId: session.id, previewUrl };
};
