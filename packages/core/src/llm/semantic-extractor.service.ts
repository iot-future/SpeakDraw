import type { IRDiagram } from '@speakdraw/shared';
import { irDiagramSchema } from '@speakdraw/shared';
import type { LLMProvider, GenerateIROptions } from './ports/llm-provider.js';
import { LLMInvalidInputError, LLMSchemaMismatchError } from './errors.js';

/**
 * Semantic extractor function signature: natural language → IRDiagram.
 */
export type SemanticExtractor = (text: string, options?: GenerateIROptions) => Promise<IRDiagram>;

/**
 * Create a semantic extractor.
 * Composes LLM Provider call + final schema safeguard validation.
 *
 * @param provider - LLM Provider instance
 * @returns SemanticExtractor function
 *
 * @example
 * ```ts
 * import { createProvider } from './provider-factory.js';
 * import { createSemanticExtractor } from './semantic-extractor.service.js';
 *
 * const provider = createProvider('openai');
 * const textToIR = createSemanticExtractor(provider);
 * const ir = await textToIR('A user table and order table, one-to-many relationship');
 * ```
 */
export function createSemanticExtractor(provider: LLMProvider): SemanticExtractor {
  return async (text: string, options?: GenerateIROptions): Promise<IRDiagram> => {
    // Input validation
    const trimmed = text.trim();
    if (!trimmed) {
      throw new LLMInvalidInputError('Input text must not be empty');
    }

    // Call provider (with built-in schema validation & retry)
    const ir = await provider.generateIR(trimmed, options);

    // Secondary safeguard validation (even though generateIR validates internally)
    const parsed = irDiagramSchema.safeParse(ir);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new LLMSchemaMismatchError(`Post-generation validation failed: ${issues}`, [issues]);
    }

    return parsed.data;
  };
}

/**
 * Convenience entry: textToIR using the default provider (from env LLM_PROVIDER, default "openai").
 *
 * @param text - Natural language description
 * @param options - Optional configuration
 * @returns Validated IRDiagram
 */
export async function textToIR(text: string, options?: GenerateIROptions): Promise<IRDiagram> {
  // Lazy import to avoid circular dependency
  const { createProvider } = await import('./provider-factory.js');
  const providerName = process.env['LLM_PROVIDER'] ?? 'openai';
  const provider = createProvider(providerName);
  const extractor = createSemanticExtractor(provider);
  return extractor(text, options);
}
