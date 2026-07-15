import { serialize, layoutDiagram } from '@speakdraw/core';
import type { IRDiagram, IRNode, IREdge } from '@speakdraw/shared';
import type { ToolHandler } from '../mcp-types.js';

export const autoLayoutHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const nodes: IRNode[] = [];
  const edges: IREdge[] = [];
  for (const cell of session.cells) {
    if (cell.type === 'vertex') {
      nodes.push({ id: cell.id, label: cell.label, type: 'process' });
    } else if (cell.type === 'edge' && cell.source && cell.target) {
      edges.push({
        id: cell.id,
        source: cell.source,
        target: cell.target,
        label: cell.label,
        type: 'flow',
      });
    }
  }

  const ir: IRDiagram = { type: 'flowchart', direction: 'LR', nodes, edges };
  const layout = await layoutDiagram(ir);
  const xml = serialize(ir, layout);

  sessionManager.updateSession(sessionId, { xml });

  return { success: true, nodeCount: nodes.length };
};
