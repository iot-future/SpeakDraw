export { layoutDiagram } from './layout/elk-layouter';
export { convertIRToELK, estimateNodeSize } from './layout/ir-to-elk';
export { mapPortToDrawio, PORT_SIDE_MATRIX } from './layout/port-mapping';
export type { DrawioPortCoords } from './layout/port-mapping';

// 序列化器（新版 + 旧版兼容）
export { serialize, serializeToDrawioXml } from './serializer/drawio-xml';
export type { SerializeOptions } from './serializer/drawio-serializer';
export { serializeToFile } from './serializer/file-writer';
export {
  buildRootCells,
  buildNodeCell,
  buildEdgeCell,
  buildContainerCell,
  wrapMxGraphModel,
  escapeXml,
} from './serializer/mxgraph-builder';

// 样式系统
export {
  NODE_STYLE_TEMPLATES,
  EDGE_STYLE_TEMPLATES,
  GROUP_STYLE_TEMPLATES,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
  CARDINALITY_TO_MARKER,
  ER_EDGE_STYLE,
} from './styling/style-templates';
export type {
  NodeStyleTemplate,
  EdgeStyleTemplate,
  GroupStyleTemplate,
  CardinalityMarker,
} from './styling/style-templates';
export {
  compileNodeStyle,
  compileEdgeStyle,
  compileGroupStyle,
  applyNodeStyle,
  applyEdgeStyle,
  buildNodeStyleMap,
  buildEdgeStyleMap,
  buildGroupStyleMap,
} from './styling/style-applier';

// LLM 模块
export {
  type LLMProvider,
  type GenerateIROptions,
  type SemanticExtractor,
  BaseLLMProvider,
  OpenAIProviderImpl,
  AnthropicProviderImpl,
  createProvider,
  getAvailableProviders,
  createSemanticExtractor,
  textToIR,
  validateWithRetry,
  buildSystemPrompt,
  LLMUnreachableError,
  LLMTimeoutError,
  LLMRefusalError,
  LLMSchemaMismatchError,
  LLMInvalidInputError,
  LLMMissingKeyError,
} from './llm';

// 校验模块
export { parseGeometry } from './validation/geometry-parser';
export type { ValidationPort } from './validation/ports/validation';
export { StaticValidatorImpl } from './validation/adapters/static-validator-impl';
export {
  detectOverlaps,
  detectEdgeThroughNode,
  detectOrphans,
  detectEdgeCrosses,
  detectLabelOverflow,
} from './validation/detectors';
export {
  aabbOverlap,
  segmentIntersectsBBox,
  linesIntersect,
} from './validation/detectors/math-utils';
export { smartFix } from './validation/smart-fix';
