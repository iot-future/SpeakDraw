import type { LanguageModel } from 'ai';
import { openai } from '@ai-sdk/openai';
import { BaseLLMProvider } from '../base.provider';
import { LLMMissingKeyError } from '../errors';

/**
 * OpenAI LLM Provider。
 *
 * 环境变量：`OPENAI_API_KEY`（必需）
 * 可选环境变量：`OPENAI_BASE_URL`（自定义 endpoint）、`OPENAI_MODEL`（模型名，默认 gpt-4o-mini）
 */
export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';

  protected createModel(): LanguageModel {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new LLMMissingKeyError(this.name);
    }

    const modelId = process.env['OPENAI_MODEL'] ?? 'gpt-4o-mini';
    return openai(modelId);
  }
}
