// packages/core/src/validation/detectors/edge-through-node-detector.ts
import type { GeometryParseResult, ValidationConflict, BBox } from '@ai-diagram/shared';
import { segmentIntersectsBBox, nextConflictId } from './math-utils';

/**
 * 检测连线穿过非端点节点的冲突。
 *
 * 对每条边的每个线段，检测是否穿过某个非 source/target 的节点包围盒。
 * 端点节点（source/target）不参与检测——边从节点边界出发，重叠是正常的。
 *
 * @param result - 几何解析结果
 * @returns 穿框冲突列表
 */
export function detectEdgeThroughNode(result: GeometryParseResult): ValidationConflict[] {
  const conflicts: ValidationConflict[] = [];

  for (const edge of result.edges) {
    const endpointIds = new Set([edge.source, edge.target]);

    for (const seg of edge.segments) {
      for (const vertex of result.vertices) {
        // 排除端点节点
        if (endpointIds.has(vertex.id)) continue;

        const bbox: BBox = vertex;
        if (segmentIntersectsBBox(seg.x1, seg.y1, seg.x2, seg.y2, bbox)) {
          conflicts.push({
            id: nextConflictId('edgeThrough'),
            type: 'edgeThroughNode',
            elements: [edge.id, vertex.id],
            message: `边 ${edge.id} 穿过节点 ${vertex.label}（id=${vertex.id}）`,
            severity: 'error',
          });
        }
      }
    }
  }

  return conflicts;
}
