import type { ToolHandler } from '../mcp-types.js';

export const findCellsHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const query = (args['query'] as string)?.toLowerCase();
  const type = args['type'] as 'vertex' | 'edge' | undefined;

  let results = session.cells;
  if (type) results = results.filter((c) => c.type === type);
  if (query)
    results = results.filter((c) => c.label.toLowerCase().includes(query) || c.id.includes(query));

  return { cells: results };
};
