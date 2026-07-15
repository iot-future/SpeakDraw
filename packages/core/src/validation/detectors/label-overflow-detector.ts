// packages/core/src/validation/detectors/label-overflow-detector.ts
import type { GeometricVertex, ValidationConflict } from '@speakdraw/shared';
import { nextConflictId } from './math-utils';

/** 字符平均宽度估算值（px），基于 14px 字体 */
const AVG_CHAR_WIDTH = 7;

/**
 * 检测标签溢出——标签预估宽度超过节点宽度。
 *
 * 使用简易估算：label.length × 7px（14px 字体平均字符宽度）。
 * 精度有限但零成本，足够作为警告提示。
 *
 * 严重程度为 warning（不阻塞生成）。
 *
 * @param vertices - 几何顶点列表
 * @returns 标签溢出冲突列表
 */
export function detectLabelOverflow(vertices: GeometricVertex[]): ValidationConflict[] {
  const conflicts: ValidationConflict[] = [];

  for (const vertex of vertices) {
    if (!vertex.label) continue;
    const estimatedWidth = vertex.label.length * AVG_CHAR_WIDTH;
    if (estimatedWidth > vertex.width) {
      conflicts.push({
        id: nextConflictId('labelOverflow'),
        type: 'labelOverflow',
        elements: [vertex.id],
        message: `节点 ${vertex.label}（id=${vertex.id}）标签可能溢出（预估宽 ${estimatedWidth}px > 实际宽 ${vertex.width}px）`,
        severity: 'warning',
      });
    }
  }

  return conflicts;
}
