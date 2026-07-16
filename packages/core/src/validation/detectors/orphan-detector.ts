// packages/core/src/validation/detectors/orphan-detector.ts
import type { GeometryParseResult, ValidationConflict } from '@speakdraw/shared';
import { nextConflictId } from './math-utils.js';

/** Actionable suggestions for orphan nodes */
const ORPHAN_SUGGESTIONS = [
  '该节点确实独立（如配置表、日志表），可以忽略此提示',
  '关联关系在提取时遗漏，可以补充描述后重新生成',
  '该节点不属于本次画图范围，可以删除后重新生成',
];

/**
 * Detect orphan nodes (nodes without any edges connected).
 *
 * Checks in-degree and out-degree of all vertices; if both are 0 the node is an orphan.
 * Severity is warning (does not block generation).
 * Each conflict includes 3 actionable suggestions to guide user decisions.
 *
 * @param result - Geometry parse result
 * @returns List of orphan conflicts with suggestions
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
