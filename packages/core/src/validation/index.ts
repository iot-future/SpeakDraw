// packages/core/src/validation/index.ts
// 校验模块统一导出

// Geometry Parser
export { parseGeometry } from './geometry-parser.js';

// Ports
export type { ValidationPort } from './ports/validation.js';

// Adapters
export { StaticValidatorImpl } from './adapters/static-validator-impl.js';

// Detectors
export {
  detectOverlaps,
  detectEdgeThroughNode,
  detectOrphans,
  detectEdgeCrosses,
  detectLabelOverflow,
} from './detectors/index.js';

// Math utilities
export { aabbOverlap, segmentIntersectsBBox, linesIntersect } from './detectors/math-utils.js';

// Smart Fix
export { smartFix } from './smart-fix.js';
