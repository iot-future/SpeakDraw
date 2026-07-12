// packages/core/src/validation/smart-fix.ts
import type {
  ValidationConflict,
  ValidationOptions,
  GeometryParseResult,
} from '@ai-diagram/shared';
import type { ValidationPort } from './ports/validation';
import { parseGeometry } from './geometry-parser';

/** 默认最大修复轮数 */
const DEFAULT_MAX_FIX_ROUNDS = 5;
/** 单次偏移量（px） */
const SHIFT_STEP = 50;

/**
 * 自动修复结果。
 */
interface SmartFixResult {
  /** 修复后的 XML 字符串 */
  xml: string;
  /** 剩余未修复的冲突 */
  remainingConflicts: ValidationConflict[];
  /** 实际修复轮数 */
  rounds: number;
}

/**
 * 自动修复几何冲突。
 *
 * 对检测到的冲突进行 fix-validate 循环，最多 maxFixRounds 轮。
 * 每轮：修复当前检测到的冲突 → 重新验证 → 若仍有 error 级冲突则继续。
 *
 * 当前支持的修复：
 * - overlap：将冲突节点沿偏移方向推开
 *
 * @param xml - 原始 draw.io XML
 * @param validator - 校验器实例
 * @param options - 校验选项（含 maxFixRounds）
 * @returns 修复结果
 */
export function smartFix(
  xml: string,
  validator: ValidationPort,
  options: ValidationOptions = {},
): SmartFixResult {
  const maxRounds = options.maxFixRounds ?? DEFAULT_MAX_FIX_ROUNDS;

  let currentXml = xml;

  for (let round = 1; round <= maxRounds; round++) {
    const report = validator.validate(currentXml, options);

    // 仅 focus error 级冲突
    const errors = report.conflicts.filter((c) => c.severity === 'error');

    if (errors.length === 0) {
      return {
        xml: currentXml,
        remainingConflicts: report.conflicts,
        rounds: round - 1,
      };
    }

    // 尝试修复
    const geometry = parseGeometry(currentXml);
    currentXml = applyFixes(currentXml, errors, geometry);
  }

  // 超限：返回最后状态
  const finalReport = validator.validate(currentXml, options);
  return {
    xml: currentXml,
    remainingConflicts: finalReport.conflicts,
    rounds: maxRounds,
  };
}

/**
 * 将冲突修复应用到 XML。
 *
 * 当前仅处理 overlap 类型冲突：将涉及的节点沿冲突中心方向推开 SHIFT_STEP 像素。
 */
function applyFixes(
  xml: string,
  conflicts: ValidationConflict[],
  geometry: GeometryParseResult,
): string {
  let result = xml;

  for (const conflict of conflicts) {
    switch (conflict.type) {
      case 'overlap': {
        result = fixOverlap(result, conflict, geometry);
        break;
      }
      // 其他冲突类型暂不支持自动修复
      default:
        break;
    }
  }

  return result;
}

/**
 * 修复重叠冲突：将第二个节点沿重叠方向推开。
 *
 * 策略：找到两个重叠节点的 bbox，计算重叠中心点方向，
 * 将后一个节点向远离方向移动 SHIFT_STEP。
 */
function fixOverlap(
  xml: string,
  conflict: ValidationConflict,
  geometry: GeometryParseResult,
): string {
  if (conflict.elements.length < 2) return xml;

  const [idA, idB] = conflict.elements;
  const vertexA = geometry.vertices.find((v) => v.id === idA);
  const vertexB = geometry.vertices.find((v) => v.id === idB);

  if (!vertexA || !vertexB) return xml;

  // 计算重叠方向（B 相对于 A 的位置）
  const centerAx = vertexA.x + vertexA.width / 2;
  const centerAy = vertexA.y + vertexA.height / 2;
  const centerBx = vertexB.x + vertexB.width / 2;
  const centerBy = vertexB.y + vertexB.height / 2;

  const dx = centerBx - centerAx;
  const dy = centerBy - centerAy;

  // 将 B 沿重叠方向推开
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let result = xml;

  if (absDx >= absDy) {
    // 水平方向推开
    const newX = vertexB.x + (dx >= 0 ? SHIFT_STEP : -SHIFT_STEP);
    result = replaceVertexX(result, idB!, newX);
  } else {
    // 垂直方向推开
    const newY = vertexB.y + (dy >= 0 ? SHIFT_STEP : -SHIFT_STEP);
    result = replaceVertexY(result, idB!, newY);
  }

  return result;
}

/**
 * 在 XML 字符串中替换指定 vertex 的 x 坐标。
 */
function replaceVertexX(xml: string, vertexId: string, newX: number): string {
  const regex = new RegExp(
    `(id="${escapeRegExp(vertexId)}"[^>]*vertex="1"[^>]*>[\\s\\S]*?<mxGeometry\\s+x=")([^"]+)(")`,
    'm',
  );
  return xml.replace(regex, `$1${Math.round(newX)}$3`);
}

/**
 * 在 XML 字符串中替换指定 vertex 的 y 坐标。
 */
function replaceVertexY(xml: string, vertexId: string, newY: number): string {
  const regex = new RegExp(
    `(id="${escapeRegExp(vertexId)}"[^>]*vertex="1"[^>]*>[\\s\\S]*?<mxGeometry\\s+[^>]*y=")([^"]+)(")`,
    'm',
  );
  return xml.replace(regex, `$1${Math.round(newY)}$3`);
}

/** 转义正则特殊字符 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
