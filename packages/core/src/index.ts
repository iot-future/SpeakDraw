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
  wrapMxGraphModel,
  escapeXml,
} from './serializer/mxgraph-builder';

// 样式系统
export {
  NODE_STYLE_TEMPLATES,
  EDGE_STYLE_TEMPLATES,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
} from './styling/style-templates';
export type { NodeStyleTemplate, EdgeStyleTemplate } from './styling/style-templates';
export {
  compileNodeStyle,
  compileEdgeStyle,
  applyNodeStyle,
  applyEdgeStyle,
  buildNodeStyleMap,
  buildEdgeStyleMap,
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
