/**
 * Application error base class — all exceptions thrown across modules MUST extend this.
 * Carries a stable error code (`code`); callers handle by code, not by message text.
 */
export class AppError extends Error {
  public override readonly name: string = 'AppError';

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}
