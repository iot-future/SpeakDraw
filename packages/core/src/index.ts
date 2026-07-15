export { layoutDiagram } from './layout/elk-layouter.js';
export { convertIRToELK, estimateNodeSize } from './layout/ir-to-elk.js';
export { mapPortToDrawio, PORT_SIDE_MATRIX } from './layout/port-mapping.js';
export type { DrawioPortCoords } from './layout/port-mapping.js';

// Serializers (new + legacy compat)
export { serialize, serializeToDrawioXml } from './serializer/drawio-xml.js';
export type { SerializeOptions } from './serializer/drawio-serializer.js';
export { serializeToFile } from './serializer/file-writer.js';
export {
  buildRootCells,
  buildNodeCell,
  buildEdgeCell,
  buildContainerCell,
  wrapMxGraphModel,
  escapeXml,
} from './serializer/mxgraph-builder.js';

// Style system
export {
  NODE_STYLE_TEMPLATES,
  EDGE_STYLE_TEMPLATES,
  GROUP_STYLE_TEMPLATES,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
  CARDINALITY_TO_MARKER,
  ER_EDGE_STYLE,
} from './styling/style-templates.js';
export type {
  NodeStyleTemplate,
  EdgeStyleTemplate,
  GroupStyleTemplate,
  CardinalityMarker,
} from './styling/style-templates.js';
export {
  compileNodeStyle,
  compileEdgeStyle,
  compileGroupStyle,
  applyNodeStyle,
  applyEdgeStyle,
  buildNodeStyleMap,
  buildEdgeStyleMap,
  buildGroupStyleMap,
} from './styling/style-applier.js';

// LLM module
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
} from './llm/index.js';

// Validation module
export { parseGeometry } from './validation/geometry-parser.js';
export type { ValidationPort } from './validation/ports/validation.js';
export { StaticValidatorImpl } from './validation/adapters/static-validator-impl.js';
export {
  detectOverlaps,
  detectEdgeThroughNode,
  detectOrphans,
  detectEdgeCrosses,
  detectLabelOverflow,
} from './validation/detectors/index.js';
export {
  aabbOverlap,
  segmentIntersectsBBox,
  linesIntersect,
} from './validation/detectors/math-utils.js';
export { smartFix } from './validation/smart-fix.js';
