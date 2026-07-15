// packages/core/src/validation/detectors/index.ts
// 检测器统一导出

export { detectOverlaps } from './overlap-detector.js';
export { detectEdgeThroughNode } from './edge-through-node-detector.js';
export { detectOrphans } from './orphan-detector.js';
export { detectEdgeCrosses } from './edge-cross-detector.js';
export { detectLabelOverflow } from './label-overflow-detector.js';
export {
  aabbOverlap,
  segmentIntersectsBBox,
  linesIntersect,
  nextConflictId,
  resetConflictCounter,
} from './math-utils.js';
