import { AppError } from '@speakdraw/shared';

/**
 * LLM call unreachable — network error, DNS failure, connection timeout.
 */
export class LLMUnreachableError extends AppError {
  public override readonly name = 'LLMUnreachableError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_UNREACHABLE', 502, cause);
  }
}

/**
 * LLM timeout — single call exceeded configured time limit (default 30s).
 */
export class LLMTimeoutError extends AppError {
  public override readonly name = 'LLMTimeoutError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_TIMEOUT', 504, cause);
  }
}

/**
 * LLM refusal — model safety policy rejected the request.
 */
export class LLMRefusalError extends AppError {
  public override readonly name = 'LLMRefusalError';
  constructor(message: string, cause?: unknown) {
    super(message, 'LLM_REFUSAL', 403, cause);
  }
}

/**
 * Schema mismatch — LLM output failed validation after all retries exhausted.
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
 * Invalid input — user-side input issue (e.g. empty text).
 */
export class LLMInvalidInputError extends AppError {
  public override readonly name = 'LLMInvalidInputError';
  constructor(message: string) {
    super(message, 'LLM_INVALID_INPUT', 400);
  }
}

/**
 * No API key configured.
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
