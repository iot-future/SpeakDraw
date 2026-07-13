import { serialize, layoutDiagram } from '@ai-diagram/core';
import type { IRDiagram, IRNode, IREdge } from '@ai-diagram/shared';
import type { ToolHandler } from '../mcp-types.js';
import type { CellInfo } from '../session/session.types.js';

interface EditOperation {
  action: 'add' | 'update' | 'delete';
  cellId?: string;
  type?: 'vertex' | 'edge';
  data: Record<string, unknown>;
}

export const editDiagramHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const operations = args['operations'] as EditOperation[] | undefined;
  if (!operations || !Array.isArray(operations) || operations.length === 0) {
    throw new Error('operations must be a non-empty array');
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const errors: string[] = [];
  let cells = [...session.cells];
  let changes = 0;

  for (const op of operations) {
    switch (op.action) {
      case 'add': {
        const id =
          (op.data['id'] as string) ??
          `cell-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const type = (op.type ?? op.data['type'] ?? 'vertex') as 'vertex' | 'edge';
        const cell: CellInfo = {
          id,
          type,
          label: (op.data['label'] as string) ?? '',
          parent: (op.data['parent'] as string) ?? '1',
          source: op.data['source'] as string | undefined,
          target: op.data['target'] as string | undefined,
          style: op.data['style'] as string | undefined,
        };
        cells.push(cell);
        changes++;
        break;
      }
      case 'update': {
        if (!op.cellId) {
          errors.push('update operation requires cellId');
          break;
        }
        const idx = cells.findIndex((c) => c.id === op.cellId);
        if (idx === -1) {
          errors.push(`Cell not found: ${op.cellId}`);
          break;
        }
        const existing = cells[idx]!;
        cells[idx] = {
          ...existing,
          label: (op.data['label'] as string) ?? existing.label,
          style: (op.data['style'] as string) ?? existing.style,
          source: (op.data['source'] as string) ?? existing.source,
          target: (op.data['target'] as string) ?? existing.target,
          parent: (op.data['parent'] as string) ?? existing.parent,
        };
        changes++;
        break;
      }
      case 'delete': {
        if (!op.cellId) {
          errors.push('delete operation requires cellId');
          break;
        }
        const before = cells.length;
        const deleted = cells.find((c) => c.id === op.cellId);
        cells = cells.filter((c) => c.id !== op.cellId);
        if (deleted?.type === 'vertex') {
          cells = cells.filter(
            (c) => !(c.type === 'edge' && (c.source === op.cellId || c.target === op.cellId)),
          );
        }
        if (cells.length < before) changes++;
        else errors.push(`Cell not found: ${op.cellId}`);
        break;
      }
    }
  }

  try {
    const nodes: IRNode[] = [];
    const edges: IREdge[] = [];
    for (const cell of cells) {
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

    sessionManager.updateSession(sessionId, {
      cells,
      xml,
      pages: [{ index: 0, name: 'Page-1', nodeCount: nodes.length, hasContent: nodes.length > 0 }],
    });
  } catch (err) {
    errors.push(`Re-layout failed: ${err instanceof Error ? err.message : 'unknown'}`);
    sessionManager.updateSession(sessionId, { cells });
  }

  return {
    success: errors.length === 0,
    changes,
    errors: errors.length > 0 ? errors : undefined,
  };
};
