// packages/core/src/validation/detectors/math-utils.ts
import type { BBox } from '@ai-diagram/shared';

/**
 * 检测两个 AABB 包围盒是否相交（含容忍误差）。
 *
 * AABB 不相交的条件是：一个矩形完全在另一个的左侧/右侧/上侧/下侧。
 * 加入 tolerance 允许极微小的边缘接触（如 1px 舍入误差）。
 *
 * @param a - 第一个包围盒
 * @param b - 第二个包围盒
 * @param tolerance - 容忍误差（px），默认 1
 * @returns 是否相交
 */
export function aabbOverlap(a: BBox, b: BBox, tolerance = 1): boolean {
  // 只有当重叠区域超过 tolerance 时才视为冲突
  // 即：a 的右边界必须超过 b 的左边界 + tolerance，且反之亦然
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return overlapX > tolerance && overlapY > tolerance;
}

/**
 * 线段与 AABB 包围盒是否相交（排除端点）。
 *
 * 用于检测连线是否穿过非端点节点。
 * 使用 Cohen-Sutherland 算法快速排除，再精确检测。
 *
 * @param x1 - 线段起点 x
 * @param y1 - 线段起点 y
 * @param x2 - 线段终点 x
 * @param y2 - 线段终点 y
 * @param bbox - 目标包围盒
 * @returns 是否相交（排除端点恰好在边界上的情况）
 */
export function segmentIntersectsBBox(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bbox: BBox,
): boolean {
  const left = bbox.x;
  const right = bbox.x + bbox.width;
  const top = bbox.y;
  const bottom = bbox.y + bbox.height;

  // 快速排除：线段两端都在矩形同一侧
  if (x1 < left && x2 < left) return false;
  if (x1 > right && x2 > right) return false;
  if (y1 < top && y2 < top) return false;
  if (y1 > bottom && y2 > bottom) return false;

  // 检查线段是否与矩形的四条边相交
  return (
    linesIntersect(x1, y1, x2, y2, left, top, left, bottom) ||
    linesIntersect(x1, y1, x2, y2, left, bottom, right, bottom) ||
    linesIntersect(x1, y1, x2, y2, right, bottom, right, top) ||
    linesIntersect(x1, y1, x2, y2, right, top, left, top) ||
    // 线段完全在矩形内部
    (x1 >= left &&
      x1 <= right &&
      y1 >= top &&
      y1 <= bottom &&
      x2 >= left &&
      x2 <= right &&
      y2 >= top &&
      y2 <= bottom)
  );
}

/**
 * 两条线段是否相交（含端点）。
 * 使用叉积/方向判断法。
 */
export function linesIntersect(
  ax1: number,
  ay1: number,
  ax2: number,
  ay2: number,
  bx1: number,
  by1: number,
  bx2: number,
  by2: number,
): boolean {
  const d1 = cross(bx1, by1, bx2, by2, ax1, ay1);
  const d2 = cross(bx1, by1, bx2, by2, ax2, ay2);
  const d3 = cross(ax1, ay1, ax2, ay2, bx1, by1);
  const d4 = cross(ax1, ay1, ax2, ay2, bx2, by2);

  // 跨立条件
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  // 共线情况
  if (d1 === 0 && onSegment(bx1, by1, bx2, by2, ax1, ay1)) return true;
  if (d2 === 0 && onSegment(bx1, by1, bx2, by2, ax2, ay2)) return true;
  if (d3 === 0 && onSegment(ax1, ay1, ax2, ay2, bx1, by1)) return true;
  if (d4 === 0 && onSegment(ax1, ay1, ax2, ay2, bx2, by2)) return true;

  return false;
}

/** 叉积 */
function cross(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
  return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
}

/** 判断点 (px, py) 是否在线段 (x1,y1)-(x2,y2) 上（假设已知共线） */
function onSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number,
): boolean {
  return (
    px >= Math.min(x1, x2) &&
    px <= Math.max(x1, x2) &&
    py >= Math.min(y1, y2) &&
    py <= Math.max(y1, y2)
  );
}

/** 生成唯一冲突 ID */
let conflictCounter = 0;
export function nextConflictId(prefix: string): string {
  conflictCounter += 1;
  return `${prefix}-${conflictCounter}`;
}

/** 重置冲突计数器（测试用） */
export function resetConflictCounter(): void {
  conflictCounter = 0;
}
