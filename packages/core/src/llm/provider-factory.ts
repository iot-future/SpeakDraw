import type { LLMProvider } from './ports/llm-provider.js';
import { OpenAIProviderImpl } from './adapters/openai-provider-impl.js';
import { AnthropicProviderImpl } from './adapters/anthropic-provider-impl.js';
import { LLMInvalidInputError } from './errors.js';

/** Registered provider name → constructor mapping */
const providerRegistry: Record<string, () => LLMProvider> = {
  openai: () => new OpenAIProviderImpl(),
  anthropic: () => new AnthropicProviderImpl(),
};

/**
 * Create an LLM Provider instance by name.
 * Case-insensitive.
 *
 * @param name - Provider name ("openai" | "anthropic")
 * @returns LLMProvider instance
 * @throws {LLMInvalidInputError} Unknown provider name
 */
export function createProvider(name: string): LLMProvider {
  const key = name.toLowerCase();
  const factory = providerRegistry[key];
  if (!factory) {
    throw new LLMInvalidInputError(
      `Unknown LLM provider "${name}". Available: ${Object.keys(providerRegistry).join(', ')}`,
    );
  }
  return factory();
}

/**
 * Get all registered provider names.
 */
export function getAvailableProviders(): string[] {
  return Object.keys(providerRegistry);
}
