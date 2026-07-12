import type { LLMProvider } from './ports/llm-provider';
import { OpenAIProviderImpl } from './adapters/openai-provider-impl';
import { AnthropicProviderImpl } from './adapters/anthropic-provider-impl';
import { LLMInvalidInputError } from './errors';

/** 已注册的 provider 名称 → 构造函数映射 */
const providerRegistry: Record<string, () => LLMProvider> = {
  openai: () => new OpenAIProviderImpl(),
  anthropic: () => new AnthropicProviderImpl(),
};

/**
 * 按名称创建 LLM Provider 实例。
 * 大小写不敏感。
 *
 * @param name - provider 名称（"openai" | "anthropic"）
 * @returns LLMProvider 实例
 * @throws {LLMInvalidInputError} 未知 provider 名称
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
 * 获取所有已注册的 provider 名称。
 */
export function getAvailableProviders(): string[] {
  return Object.keys(providerRegistry);
}
