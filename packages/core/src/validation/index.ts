// packages/core/src/validation/index.ts
// 校验模块统一导出

// Geometry Parser
export { parseGeometry } from './geometry-parser';

// Ports
export type { ValidationPort } from './ports/validation';

// Adapters
export { StaticValidatorImpl } from './adapters/static-validator-impl';

// Detectors
export {
  detectOverlaps,
  detectEdgeThroughNode,
  detectOrphans,
  detectEdgeCrosses,
  detectLabelOverflow,
} from './detectors';

// Math utilities
export { aabbOverlap, segmentIntersectsBBox, linesIntersect } from './detectors/math-utils';

// Smart Fix
export { smartFix } from './smart-fix';
