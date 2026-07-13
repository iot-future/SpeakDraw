import { textToIR, layoutDiagram, serialize, StaticValidatorImpl } from '@ai-diagram/core';
import type { ToolHandler } from '../mcp-types.js';

export const generateDiagramHandler: ToolHandler = async (args, sessionManager, previewServer) => {
  const description = args['description'] as string | undefined;
  if (!description || !description.trim()) {
    throw new Error('description must be a non-empty string');
  }

  // 获取或创建 session
  let sessionId: string;
  const inputSessionId = args['sessionId'] as string | undefined;
  let session = inputSessionId ? sessionManager.getSession(inputSessionId) : undefined;
  if (!session) {
    session = sessionManager.createSession();
    sessionId = session.id;
  } else {
    sessionId = inputSessionId as string;
  }

  // 全链路生成：text → IR → layout → XML
  const ir = await textToIR(description.trim());
  const layout = await layoutDiagram(ir);
  const xml = serialize(ir, layout);

  // 解析 cells 信息
  const cells = [
    ...ir.nodes.map((n) => ({ id: n.id, type: 'vertex' as const, label: n.label, parent: '1' })),
    ...ir.edges.map((e) => ({
      id: e.id,
      type: 'edge' as const,
      label: e.label ?? '',
      parent: '1',
      source: e.source,
      target: e.target,
    })),
  ];

  // 更新 session
  sessionManager.updateSession(sessionId, {
    xml,
    cells,
    pages: [{ index: 0, name: 'Page-1', nodeCount: ir.nodes.length, hasContent: true }],
  });

  // 静态几何校验
  let conflicts: unknown[] = [];
  try {
    const validator = new StaticValidatorImpl();
    const report = await validator.validate(xml, { tolerance: 1 });
    conflicts = report.conflicts;
  } catch (err: unknown) {
    process.stderr.write(
      `[mcp-server] validation failed for session ${sessionId}: ${err instanceof Error ? err.message : 'unknown'}\n`,
    );
  }

  const previewUrl = previewServer.getPreviewUrl(sessionId);

  return {
    sessionId,
    diagramId: `diagram-${sessionId}`,
    type: ir.type,
    nodeCount: ir.nodes.length,
    edgeCount: ir.edges.length,
    previewUrl,
    conflicts,
  };
};
