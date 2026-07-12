import { AppError } from '@ai-diagram/shared';

/**
 * LLM 调用不可达 — 网络错误、DNS 解析失败、连接超时。
 * 终端用户应检查网络与 API endpoint。
 */
export class LLMUnreachableError extends AppError {
  public override readonly name = 'LLMUnreachableError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_UNREACHABLE', 502, cause);
  }
}

/**
 * LLM 超时 — 单次调用超出配置的时间限制（默认 30s）。
 */
export class LLMTimeoutError extends AppError {
  public override readonly name = 'LLMTimeoutError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_TIMEOUT', 504, cause);
  }
}

/**
 * LLM 拒绝 — 模型安全策略拒绝处理该请求。
 * 可能原因：输入内容触发 safety filter。
 */
export class LLMRefusalError extends AppError {
  public override readonly name = 'LLMRefusalError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_REFUSAL', 403, cause);
  }
}

/**
 * Schema 不匹配 — LLM 产出的 JSON 经 zod 校验失败，且重试耗尽。
 * 终端用户应补充或修正输入描述。
 */
export class LLMSchemaMismatchError extends AppError {
  public override readonly name = 'LLMSchemaMismatchError';
  constructor(
    message: string,
    public readonly validationErrors: string[],
    cause?: unknown,
  ) {
    super(message, 'LLM_SCHEMA_MISMATCH', 422, cause);
  }
}

/**
 * 参数无效 — 用户侧输入问题（如空文本）。
 */
export class LLMInvalidInputError extends AppError {
  public override readonly name = 'LLMInvalidInputError';
  constructor(message: string) {
    super(message, 'LLM_INVALID_INPUT', 400);
  }
}

/**
 * 无 API Key 配置。
 */
export class LLMMissingKeyError extends AppError {
  public override readonly name = 'LLMMissingKeyError';
  constructor(providerName: string) {
    super(
      `No API key configured for provider "${providerName}". Set the appropriate environment variable.`,
      'LLM_MISSING_KEY',
      401,
    );
  }
}
