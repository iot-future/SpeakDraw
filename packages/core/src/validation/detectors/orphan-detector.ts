// packages/core/src/validation/detectors/orphan-detector.ts
import type { GeometryParseResult, ValidationConflict } from '@ai-diagram/shared';
import { nextConflictId } from './math-utils';

/**
 * 检测孤立节点（无任何边连接的节点）。
 *
 * 检查所有顶点的入度和出度，若两者均为 0 则为孤立节点。
 * 严重程度为 warning（不阻塞生成）。
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
      });
    }
  }

  return conflicts;
}
