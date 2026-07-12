import type { IRDiagram } from '@ai-diagram/shared';

/**
 * LLM 生成 IR 的配置选项。
 */
export interface GenerateIROptions {
  /** 最大重试次数（默认 3） */
  maxRetries?: number;
  /** 单次调用超时时间（ms，默认 30000） */
  timeout?: number;
  /** 自定义 system prompt（覆盖内置 prompt） */
  systemPrompt?: string;
  /** 显式指定图类型（不指定则自动推断） */
  diagramType?: IRDiagram['type'];
}

/**
 * LLM Provider 接口 — 语义提取的抽象端口。
 * 每个 LLM 服务商实现此接口。
 *
 * 新增实现步骤：1) 实现接口 2) 注册到 provider 工厂 3) 加测试。
 */
export interface LLMProvider {
  /** Provider 唯一名称，如 "openai"、"anthropic" */
  readonly name: string;

  /**
   * 将自然语言文本转换为 IRDiagram 中间表示。
   * 自动推断图类型与布局方向。
   *
   * @param text - 自然语言描述
   * @param options - 可选配置
   * @returns 校验通过的 IRDiagram
   * @throws {LLMSchemaMismatchError} 重试耗尽后仍未通过校验
   * @throws {LLMUnreachableError} 网络不可达
   * @throws {LLMTimeoutError} 调用超时
   * @throws {LLMInvalidInputError} 输入无效
   * @throws {LLMMissingKeyError} 缺少 API Key
   */
  generateIR(text: string, options?: GenerateIROptions): Promise<IRDiagram>;
}
