import type { ToolHandler } from '../mcp-types.js';

export const getDiagramHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  return {
    xml: session.xml,
    cells: session.cells,
    pageCount: session.pages.length,
  };
};
