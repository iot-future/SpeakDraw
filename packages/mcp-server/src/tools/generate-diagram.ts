import { layoutDiagram, serialize, StaticValidatorImpl } from '@speakdraw/core';
import { irDiagramSchema } from '@speakdraw/shared';
import type { IRDiagram, ValidationConflict } from '@speakdraw/shared';
import type { ToolHandler } from '../mcp-types.js';

export const generateDiagramHandler: ToolHandler = async (args, sessionManager, previewServer) => {
  // 支持两种输入：IR 对象（推荐，零 Key 依赖）或 description 字符串（传统，需服务端 Key）
  const irInput = args['ir'] as IRDiagram | undefined;
  const description = args['description'] as string | undefined;

  let ir: IRDiagram;

  if (irInput) {
    // 模式1：调用方 LLM 已出 IR，直接校验后使用
    const parsed = irDiagramSchema.safeParse(irInput);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`IR validation failed: ${issues}`);
    }
    ir = parsed.data;
  } else if (description) {
    // 模式2：传统路径，服务端 LLM 出 IR（需要 OPENAI_API_KEY）
    const { textToIR } = await import('@speakdraw/core');
    ir = await textToIR(description.trim());
  } else {
    throw new Error('Either "ir" (recommended) or "description" must be provided');
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

  // 布局 → 序列化
  const layout = await layoutDiagram(ir);
  const xml = serialize(ir, layout);

  // 解析 cells
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

  sessionManager.updateSession(sessionId, {
    xml,
    cells,
    pages: [{ index: 0, name: 'Page-1', nodeCount: ir.nodes.length, hasContent: true }],
  });

  // 静态几何校验
  let conflicts: ValidationConflict[] = [];
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
