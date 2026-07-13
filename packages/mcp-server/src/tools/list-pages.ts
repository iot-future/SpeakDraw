import type { ToolHandler } from '../mcp-types.js';

export const listPagesHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  return { pages: session.pages };
};
