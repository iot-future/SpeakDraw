export { layoutDiagram } from './layout/elk-layouter';
export { convertIRToELK, estimateNodeSize } from './layout/ir-to-elk';
export { mapPortToDrawio, PORT_SIDE_MATRIX } from './layout/port-mapping';
export type { DrawioPortCoords } from './layout/port-mapping';

export { serializeToDrawioXml } from './serializer/drawio-xml';

export {
  // Provider types
  type LLMProvider,
  type GenerateIROptions,
  type SemanticExtractor,
  // Providers
  BaseLLMProvider,
  OpenAIProviderImpl,
  AnthropicProviderImpl,
  createProvider,
  getAvailableProviders,
  // Entry point
  createSemanticExtractor,
  textToIR,
  // Utilities
  validateWithRetry,
  buildSystemPrompt,
  // Errors
  LLMUnreachableError,
  LLMTimeoutError,
  LLMRefusalError,
  LLMSchemaMismatchError,
  LLMInvalidInputError,
  LLMMissingKeyError,
} from './llm';
