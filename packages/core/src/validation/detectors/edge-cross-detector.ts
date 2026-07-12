// packages/core/src/validation/detectors/edge-cross-detector.ts
import type { GeometryParseResult, ValidationConflict } from '@ai-diagram/shared';
import { linesIntersect, nextConflictId } from './math-utils';

/**
 * 检测边与边之间的线段交叉冲突。
 *
 * 对所有边两两比较，检测各自线段之间是否有交叉点。
 * 同一对边只报告一次冲突。
 *
 * 注：正交交叉（垂直正交）不视为冲突——在 ER 图/流程图中
 * 正交路由边交叉是正常现象，仅斜线交叉才需要报告。
 *
 * @param result - 几何解析结果
 * @returns 边交叉冲突列表
 */
export function detectEdgeCrosses(result: GeometryParseResult): ValidationConflict[] {
  const conflicts: ValidationConflict[] = [];
  const reportedPairs = new Set<string>();

  for (let i = 0; i < result.edges.length; i++) {
    for (let j = i + 1; j < result.edges.length; j++) {
      const edgeA = result.edges[i]!;
      const edgeB = result.edges[j]!;

      // 同一对边只报告一次
      if (reportedPairs.has(`${edgeA.id}-${edgeB.id}`)) continue;
      if (reportedPairs.has(`${edgeB.id}-${edgeA.id}`)) continue;

      let crossed = false;
      segmentLoop: for (const segA of edgeA.segments) {
        for (const segB of edgeB.segments) {
          // 检查是否正交（水平与垂直线段），正交交叉不报
          if (isOrthogonal(segA, segB)) continue;

          if (
            linesIntersect(segA.x1, segA.y1, segA.x2, segA.y2, segB.x1, segB.y1, segB.x2, segB.y2)
          ) {
            crossed = true;
            break segmentLoop;
          }
        }
      }

      if (crossed) {
        reportedPairs.add(`${edgeA.id}-${edgeB.id}`);
        conflicts.push({
          id: nextConflictId('edgeCross'),
          type: 'edgeCross',
          elements: [edgeA.id, edgeB.id],
          message: `边 ${edgeA.id} 与 ${edgeB.id} 交叉`,
          severity: 'error',
        });
      }
    }
  }

  return conflicts;
}

/**
 * 判断两条线段是否正交（一条水平、一条垂直）。
 * 正交路由边交叉是正常的布局行为，不视为冲突。
 */
function isOrthogonal(
  a: { x1: number; y1: number; x2: number; y2: number },
  b: { x1: number; y1: number; x2: number; y2: number },
): boolean {
  const aHorizontal = Math.abs(a.y1 - a.y2) < 0.01;
  const aVertical = Math.abs(a.x1 - a.x2) < 0.01;
  const bHorizontal = Math.abs(b.y1 - b.y2) < 0.01;
  const bVertical = Math.abs(b.x1 - b.x2) < 0.01;

  return (aHorizontal && bVertical) || (aVertical && bHorizontal);
}
