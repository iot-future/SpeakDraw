import type { LanguageModel } from 'ai';
import { generateObject } from 'ai';
import type { IRDiagram } from '@ai-diagram/shared';
import { irDiagramSchema } from '@ai-diagram/shared';
import type { LLMProvider, GenerateIROptions } from './llm-provider';
import { buildSystemPrompt } from '../prompts';
import { LLMInvalidInputError, LLMTimeoutError, LLMUnreachableError } from '../errors';
import { validateWithRetry } from '../schema-validator.service';

/** 默认重试间隔（ms）— 递增：1s / 3s / 5s */
const DEFAULT_RETRY_INTERVALS = [1000, 3000, 5000];

/** 默认超时（ms） */
const DEFAULT_TIMEOUT = 30_000;

/**
 * LLM Provider 抽象基类。
 * 封装了 AI SDK generateObject 调用、prompt 构建、schema 校验与重试逻辑。
 * 子类只需实现 `createModel()` 返回对应厂商的 LanguageModel 实例。
 *
 * 重试逻辑委托给 `validateWithRetry`，本类负责 LLM 调用编排与错误分类。
 */
export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly name: string;

  /** 子类实现：返回 AI SDK 兼容的 LanguageModel */
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
          // 超时
          if (err instanceof Error && err.message === 'LLM_CALL_TIMEOUT') {
            throw new LLMTimeoutError(`LLM call timed out after ${timeout}ms`, err);
          }
          // 网络/连接错误
          if (err instanceof TypeError || (err instanceof Error && isNetworkError(err))) {
            throw new LLMUnreachableError(
              `Cannot reach LLM provider "${this.name}": ${(err as Error).message}`,
              err,
            );
          }
          // 其他错误透传
          throw err;
        }
      },
      maxRetries,
      DEFAULT_RETRY_INTERVALS,
    );
  }
}

/**
 * 为异步操作添加超时 + AbortController 取消支持。
 * 超时后主动 abort 底层请求，避免资源泄漏。
 */
async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);

  try {
    return await fn(controller.signal);
  } catch (err) {
    // 超时触发的 abort → 转为可识别的 timeout 错误
    if (controller.signal.aborted) {
      throw new Error('LLM_CALL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 判断是否为网络层错误（可抛出 LLMUnreachableError）。
 */
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
