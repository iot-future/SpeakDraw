// packages/core/src/validation/adapters/static-validator-impl.ts
import type { ValidationReport, ValidationOptions, GeometryParseResult } from '@speakdraw/shared';
import type { ValidationPort } from '../ports/validation';
import { parseGeometry } from '../geometry-parser';
import { detectOverlaps } from '../detectors/overlap-detector';
import { detectEdgeThroughNode } from '../detectors/edge-through-node-detector';
import { detectOrphans } from '../detectors/orphan-detector';
import { detectEdgeCrosses } from '../detectors/edge-cross-detector';
import { resetConflictCounter } from '../detectors/math-utils';

/** 默认容忍误差（px） */
const DEFAULT_TOLERANCE = 1;

/**
 * 静态几何校验器实现。
 *
 * 零成本静态分析——解析 draw.io XML 的 mxCell 坐标，
 * 运行重叠/穿框/孤立/交叉检测器，输出结构化冲突报告。
 *
 * 实现 ValidationPort 接口。
 */
export class StaticValidatorImpl implements ValidationPort {
  /**
   * 对 draw.io XML 执行静态几何校验。
   *
   * 流程：
   * 1. 解析 XML 提取顶点与边几何信息
   * 2. 依次运行各检测器
   * 3. 汇总生成 ValidationReport
   *
   * @param xml - draw.io mxGraphModel XML 字符串
   * @param options - 校验选项
   * @returns 校验报告
   */
  validate(xml: string, options: ValidationOptions = {}): ValidationReport {
    // 每次调用重置计数器，确保冲突 ID 唯一
    resetConflictCounter();

    const tolerance = options.tolerance ?? DEFAULT_TOLERANCE;

    // 1. 解析几何信息
    const geometry: GeometryParseResult = parseGeometry(xml);

    // 2. 运行检测器
    const overlapConflicts = detectOverlaps(geometry.vertices, tolerance);
    const throughNodeConflicts = detectEdgeThroughNode(geometry);
    const orphanConflicts = detectOrphans(geometry);
    const crossConflicts = detectEdgeCrosses(geometry);

    const conflicts = [
      ...overlapConflicts,
      ...throughNodeConflicts,
      ...orphanConflicts,
      ...crossConflicts,
    ];

    // 3. 仅 error 级别冲突导致不通过
    const errorCount = conflicts.filter((c) => c.severity === 'error').length;

    return {
      passed: errorCount === 0,
      conflicts,
      summary:
        errorCount === 0
          ? '校验通过，未发现冲突'
          : `发现 ${errorCount} 个冲突（共 ${conflicts.length} 个问题）`,
    };
  }
}
