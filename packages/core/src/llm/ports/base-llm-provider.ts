import type { LanguageModel } from 'ai';
import { generateObject } from 'ai';
import type { IRDiagram } from '@speakdraw/shared';
import { irDiagramSchema } from '@speakdraw/shared';
import type { LLMProvider, GenerateIROptions } from './llm-provider.js';
import { buildSystemPrompt } from '../prompts/index.js';
import { LLMInvalidInputError, LLMTimeoutError, LLMUnreachableError } from '../errors.js';
import { validateWithRetry } from '../schema-validator.service.js';

/** Default retry intervals in ms — staggered: 1s / 3s / 5s */
const DEFAULT_RETRY_INTERVALS = [1000, 3000, 5000];

/** Default timeout in ms */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Abstract base class for LLM Providers.
 * Encapsulates AI SDK generateObject calls, prompt construction, schema validation & retry logic.
 * Subclasses only need to implement `createModel()` returning the vendor-specific LanguageModel.
 *
 * Retry logic is delegated to `validateWithRetry`; this class handles LLM call orchestration & error classification.
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly name: string;

  /** Subclass implements: returns an AI SDK compatible LanguageModel */
  protected abstract createModel(): LanguageModel;

  async generateIR(text: string, options: GenerateIROptions = {}): Promise<IRDiagram> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new LLMInvalidInputError('Input text must not be empty');
    }

    const maxRetries = options.maxRetries ?? 3;
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const systemPrompt = options.systemPrompt ?? buildSystemPrompt(options.diagramType);

    return validateWithRetry(
      async (feedback?: string) => {
        const model = this.createModel();

        const messages: Array<{ role: 'user'; content: string }> = [
          { role: 'user', content: trimmed },
        ];
        if (feedback) {
          messages.push({
            role: 'user',
            content: `Your previous output failed validation with these errors:\n${feedback}\n\nPlease fix ALL errors and output a valid IR JSON. Do NOT include any explanation.`,
          });
        }

        try {
          const { object } = await withTimeout(
            (signal) =>
              generateObject({
                model,
                schema: irDiagramSchema,
                system: systemPrompt,
                messages,
                temperature: 0.1,
                maxTokens: 4096,
                abortSignal: signal,
              }),
            timeout,
          );
          return object;
        } catch (err: unknown) {
          // Timeout
          if (err instanceof Error && err.message === 'LLM_CALL_TIMEOUT') {
            throw new LLMTimeoutError(`LLM call timed out after ${timeout}ms`, err);
          }
          // Network / connection errors
          if (err instanceof TypeError || (err instanceof Error && isNetworkError(err))) {
            throw new LLMUnreachableError(
              `Cannot reach LLM provider "${this.name}": ${(err as Error).message}`,
              err,
            );
          }
          // Pass through other errors
          throw err;
        }
      },
      maxRetries,
      DEFAULT_RETRY_INTERVALS,
    );
  }
}

/**
 * Adds timeout + AbortController cancellation support.
 * Aborts the underlying request on timeout to prevent resource leaks.
 */
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fn(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('LLM_CALL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Checks if an error is a network-layer error. */
function isNetworkError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('dns')
  );
}
