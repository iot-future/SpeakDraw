// packages/core/src/validation/ports/validation.ts
import type { ValidationReport, ValidationOptions } from '@ai-diagram/shared';

/**
 * 校验端口接口。
 *
 * 定义对 draw.io XML 进行静态几何校验的契约。
 * 不同实现可提供不同的检测策略（静态 AABB / VLM 视觉 / 等）。
 */
export interface ValidationPort {
  /**
   * 对 draw.io XML 执行静态几何校验。
   *
   * @param xml - draw.io mxGraphModel XML 字符串
   * @param options - 校验选项（容忍误差、是否启用标签检测等）
   * @returns 校验报告（含冲突列表与通过状态）
   */
  validate(xml: string, options?: ValidationOptions): ValidationReport;
}
