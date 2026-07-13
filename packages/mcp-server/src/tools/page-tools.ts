import type { ToolHandler } from '../mcp-types.js';
import type { PageInfo, Session } from '../session/session.types.js';
import type { SessionManager } from '../session/session-manager.js';

function requireSession(sessionId: unknown, manager: SessionManager): Session {
  if (!sessionId || typeof sessionId !== 'string') throw new Error('sessionId is required');
  const s = manager.getSession(sessionId);
  if (!s) throw new Error(`Session not found: ${sessionId}`);
  return s;
}

export const addPageHandler: ToolHandler = async (args, sessionManager) => {
  const session = requireSession(args['sessionId'], sessionManager);
  const name = (args['name'] as string) ?? `Page-${session.pages.length + 1}`;
  const newPage: PageInfo = {
    index: session.pages.length,
    name,
    nodeCount: 0,
    hasContent: false,
  };
  sessionManager.updateSession(session.id, { pages: [...session.pages, newPage] });
  return { pageIndex: newPage.index };
};

export const renamePageHandler: ToolHandler = async (args, sessionManager) => {
  const session = requireSession(args['sessionId'], sessionManager);
  const pageIndex = args['pageIndex'] as number;
  const name = args['name'] as string;
  if (pageIndex === undefined || pageIndex === null) throw new Error('pageIndex is required');
  if (!name) throw new Error('name is required');

  const pages = [...session.pages];
  const page = pages[pageIndex];
  if (!page) throw new Error(`Page index ${pageIndex} not found`);
  pages[pageIndex] = { ...page, name };
  sessionManager.updateSession(session.id, { pages });
  return { success: true };
};

export const deletePageHandler: ToolHandler = async (args, sessionManager) => {
  const session = requireSession(args['sessionId'], sessionManager);
  const pageIndex = args['pageIndex'] as number;
  if (pageIndex === undefined || pageIndex === null) throw new Error('pageIndex is required');
  if (session.pages.length <= 1) throw new Error('Cannot delete the last page');

  const pages = session.pages.filter((_, i) => i !== pageIndex);
  const reindexed = pages.map((p, i) => ({ ...p, index: i }));
  sessionManager.updateSession(session.id, { pages: reindexed });
  return { success: true, pages: reindexed };
};
