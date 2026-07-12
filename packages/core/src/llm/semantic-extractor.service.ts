import type { IRDiagram } from '@ai-diagram/shared';
import { irDiagramSchema } from '@ai-diagram/shared';
import type { LLMProvider, GenerateIROptions } from './ports/llm-provider';
import { LLMInvalidInputError, LLMSchemaMismatchError } from './errors';

/**
 * 语义提取器函数签名：自然语言 → IRDiagram。
 */
export type SemanticExtractor = (text: string, options?: GenerateIROptions) => Promise<IRDiagram>;

/**
 * 创建语义提取器。
 * 组合 LLM Provider 调用 + 最终 schema 兜底校验。
 *
 * @param provider - LLM Provider 实例
 * @returns SemanticExtractor 函数
 *
 * @example
 * ```ts
 * import { createProvider } from './provider-factory';
 * import { createSemanticExtractor } from './semantic-extractor.service';
 *
 * const provider = createProvider('openai');
 * const textToIR = createSemanticExtractor(provider);
 * const ir = await textToIR('用户表和订单表，一对多关系');
 * ```
 */
export function createSemanticExtractor(provider: LLMProvider): SemanticExtractor {
  return async (text: string, options?: GenerateIROptions): Promise<IRDiagram> => {
    // 入参校验
    const trimmed = text.trim();
    if (!trimmed) {
      throw new LLMInvalidInputError('Input text must not be empty');
    }

    // 调用 provider（含内置 schema 校验与重试）
    const ir = await provider.generateIR(trimmed, options);

    // 二次兜底校验（即使 generateIR 内部已校验，入口层也做一遍保底）
    const parsed = irDiagramSchema.safeParse(ir);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new LLMSchemaMismatchError(`Post-generation validation failed: ${issues}`, [issues]);
    }

    return parsed.data;
  };
}

/**
 * 便捷入口：使用默认 provider（从环境变量 LLM_PROVIDER 读取，默认 openai）的 textToIR。
 *
 * 环境变量：
 * - `LLM_PROVIDER`: provider 名称（"openai" | "anthropic"，默认 "openai"）
 * - 各 provider 专用的 API Key 环境变量
 *
 * @param text - 自然语言描述
 * @param options - 可选配置
 * @returns 校验通过的 IRDiagram
 */
export async function textToIR(text: string, options?: GenerateIROptions): Promise<IRDiagram> {
  // 延迟 import 避免循环依赖
  const { createProvider } = await import('./provider-factory');
  const providerName = process.env['LLM_PROVIDER'] ?? 'openai';
  const provider = createProvider(providerName);
  const extractor = createSemanticExtractor(provider);
  return extractor(text, options);
}
