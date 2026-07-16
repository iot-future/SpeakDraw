// packages/core/src/validation/detectors/orphan-detector.ts
import type { GeometryParseResult, ValidationConflict } from '@speakdraw/shared';
import { nextConflictId } from './math-utils.js';

/** 孤立节点的处理建议 */
const ORPHAN_SUGGESTIONS = [
  '该节点确实独立（如配置表、日志表），可以忽略此提示',
  '关联关系在提取时遗漏，可以补充描述后重新生成',
  '该节点不属于本次画图范围，可以删除后重新生成',
];

/**
 * 检测孤立节点（无任何边连接的节点）。
 *
 * 检查所有顶点的入度和出度，若两者均为 0 则为孤立节点。
 * 严重程度为 warning（不阻塞生成）。
 * 每个冲突附带 3 条处理建议，引导用户自行决策。
 *
 * @param result - 几何解析结果
 * @returns 孤立冲突列表
 */
export function detectOrphans(result: GeometryParseResult): ValidationConflict[] {
  const connectedIds = new Set<string>();

  for (const edge of result.edges) {
    if (edge.source) connectedIds.add(edge.source);
    if (edge.target) connectedIds.add(edge.target);
  }

  const conflicts: ValidationConflict[] = [];

  for (const vertex of result.vertices) {
    if (!connectedIds.has(vertex.id)) {
      conflicts.push({
        id: nextConflictId('orphan'),
        type: 'orphan',
        elements: [vertex.id],
        message: `节点 ${vertex.label}（id=${vertex.id}）为孤立节点，无任何边连接`,
        severity: 'warning',
        suggestions: ORPHAN_SUGGESTIONS,
      });
    }
  }

  return conflicts;
}
