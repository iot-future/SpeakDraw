// packages/core/src/validation/detectors/overlap-detector.ts
import type { GeometricVertex, ValidationConflict } from '@speakdraw/shared';
import { aabbOverlap, nextConflictId } from './math-utils';

/**
 * 检测节点重叠冲突（AABB 相交）。
 *
 * 对所有顶点两两比较包围盒，检测是否有重叠区域。
 * 容忍误差默认为 1px（由 aabbOverlap 负责）。
 *
 * @param vertices - 几何顶点列表
 * @param tolerance - 容忍误差（px），默认 1
 * @returns 重叠冲突列表
 */
export function detectOverlaps(
  vertices: GeometricVertex[],
  tolerance?: number,
): ValidationConflict[] {
  const conflicts: ValidationConflict[] = [];

  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const a = vertices[i]!;
      const b = vertices[j]!;
      if (aabbOverlap(a, b, tolerance)) {
        conflicts.push({
          id: nextConflictId('overlap'),
          type: 'overlap',
          elements: [a.id, b.id],
          message: `节点 ${a.label}（id=${a.id}）与 ${b.label}（id=${b.id}）重叠`,
          severity: 'error',
        });
      }
    }
  }

  return conflicts;
}
