/**
 * 应用错误基类 — 所有跨模块抛出的异常必须继承此类。
 * 携带稳定错误码（code），调用方按码处理，不依赖 message 文本。
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
