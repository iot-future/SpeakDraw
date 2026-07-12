// packages/core/src/validation/detectors/index.ts
// 检测器统一导出

export { detectOverlaps } from './overlap-detector';
export { detectEdgeThroughNode } from './edge-through-node-detector';
export { detectOrphans } from './orphan-detector';
export { detectEdgeCrosses } from './edge-cross-detector';
export { detectLabelOverflow } from './label-overflow-detector';
export {
  aabbOverlap,
  segmentIntersectsBBox,
  linesIntersect,
  nextConflictId,
  resetConflictCounter,
} from './math-utils';
