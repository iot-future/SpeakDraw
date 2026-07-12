import type { LanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { BaseLLMProvider } from '../ports/base-llm-provider';
import { LLMMissingKeyError } from '../errors';

/**
 * Anthropic LLM Provider 实现。
 *
 * 环境变量：`ANTHROPIC_API_KEY`（必需）
 * 可选环境变量：`ANTHROPIC_BASE_URL`（自定义 endpoint）、`ANTHROPIC_MODEL`（模型名，默认 claude-3-5-haiku-latest）
 */
export class AnthropicProviderImpl extends BaseLLMProvider {
  readonly name = 'anthropic';

  protected createModel(): LanguageModel {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      throw new LLMMissingKeyError(this.name);
    }

    const modelId = process.env['ANTHROPIC_MODEL'] ?? 'claude-3-5-haiku-latest';
    return anthropic(modelId);
  }
}
