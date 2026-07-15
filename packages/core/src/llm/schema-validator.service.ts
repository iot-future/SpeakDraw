import { irDiagramSchema } from '@speakdraw/shared';
import type { IRDiagram } from '@speakdraw/shared';
import { LLMSchemaMismatchError } from './errors';

/**
 * Zod 校验错误格式化为人类可读文本，用于回灌 LLM。
 *
 * @param issues - Zod safeParse 返回的 issues 数组
 * @returns 格式化后的错误描述文本
 */
export function formatZodIssues(
  issues: Array<{ message: string; path: Array<string | number> }>,
): string {
  return issues
    .map((issue) => `- Field "${issue.path.join('.') || '(root)'}": ${issue.message}`)
    .join('\n');
}

/**
 * 简单的 sleep 工具函数。
 *
 * @param ms - 等待毫秒数
 * @returns 在指定时间后 resolve 的 Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带重试的 IR Schema 校验。
 * 每次 generate 可接收上一次的校验错误作为 feedback 参数。
 *
 * @param generate - 生成函数，接收上次错误 feedback（首次为 undefined）
 * @param maxRetries - 最大重试次数（默认 3）
 * @param retryIntervals - 重试间隔 ms（默认 [1000, 3000, 5000]）
 * @returns 校验通过的 IRDiagram
 * @throws {LLMSchemaMismatchError} 重试耗尽后仍未通过校验
 * @throws 非 schema 校验类错误（如网络错误）会立即透传，不重试
 */
export async function validateWithRetry(
  generate: (feedback?: string) => Promise<unknown>,
  maxRetries = 3,
  retryIntervals: number[] = [1000, 3000, 5000],
): Promise<IRDiagram> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 非 schema 校验错误（如网络错误）会自然透传，不重试
    const raw: unknown = await generate(feedback);

    const parsed = irDiagramSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }

    feedback = formatZodIssues(parsed.error.issues);

    if (attempt < maxRetries) {
      const interval = retryIntervals[attempt] ?? 5000;
      await sleep(interval);
    }
  }

  throw new LLMSchemaMismatchError(
    `IR schema validation failed after ${maxRetries + 1} attempt(s). Please provide more details in your input.`,
    feedback ? [feedback] : ['Unknown validation error'],
  );
}
