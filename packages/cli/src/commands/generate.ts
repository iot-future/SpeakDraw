import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  textToIR,
  layoutDiagram,
  serializeToFile,
  LLMUnreachableError,
  LLMTimeoutError,
  LLMSchemaMismatchError,
  LLMInvalidInputError,
  LLMMissingKeyError,
} from '@speakdraw/core';
import type { LayoutOptions } from '@speakdraw/shared';
import { loadConfig, parseEnvApiKey } from '../config.js';
import { createLogger, type CliLogger } from '../utils/logger.js';

export interface GenerateOptions {
  /** 输入文件路径 */
  file?: string;
  /** 输出文件路径 */
  output?: string;
  /** LLM provider 名称 */
  provider: string;
  /** 具体模型名 */
  model?: string;
  /** 详细输出 */
  verbose: boolean;
  /** 静默模式 */
  quiet: boolean;
}

/**
 * 执行 'speakdraw generate` 命令。
 *
 * @param description - 自然语言描述（与 file 至少有一个非空）
 * @param options - 命令选项
 * @returns 退出码: 0=成功, 1=参数错误, 2=LLM 不可达, 3=schema 校验失败
 */
export async function runGenerate(description: string, options: GenerateOptions): Promise<number> {
  const log = createLogger({ verbose: options.verbose, quiet: options.quiet });

  // 1. 解决输入来源
  if (!description && !options.file) {
    log.error('请提供描述文本或指定输入文件 (-f <file>)');
    return 1;
  }

  let text: string;
  if (options.file) {
    try {
      text = await readFile(options.file, 'utf-8');
    } catch (cause) {
      log.error(`无法读取文件: ${options.file} — ${(cause as Error).message}`);
      return 1;
    }
  } else {
    text = description;
  }

  if (!text.trim()) {
    log.error('输入文本为空');
    return 1;
  }

  // 2. 检查 API Key
  const apiKey = parseEnvApiKey(options.provider);
  if (!apiKey) {
    log.error(`请设置 ${getApiKeyEnvName(options.provider)} 环境变量`);
    return 1;
  }

  // 3. 配置
  const config = loadConfig(options);
  const outputPath = options.output
    ? resolve(options.output)
    : resolve(config.outputDir, 'diagram.drawio');

  // 4. 调用 LLM 提取语义
  let spinner = log.startSpinner('正在调用 LLM 提取语义关系...');

  // 保存并设置 model 环境变量（核心库的 provider 通过 env 读取 model 名）
  const prevModel = options.model ? process.env['SPEAKDRAW_MODEL'] : undefined;
  if (options.model) {
    process.env['SPEAKDRAW_MODEL'] = options.model;
  }

  try {
    const ir = await textToIR(text, {});

    log.stopSpinner(spinner, '语义提取完成');
    log.verbose(`IR: ${JSON.stringify(ir, null, 2)}`);

    // 5. ELK 布局
    spinner = log.startSpinner('正在计算自动布局...');

    const layoutOptions: LayoutOptions = {
      direction: config.layoutDirection,
    };
    const layout = await layoutDiagram(ir, layoutOptions);

    log.stopSpinner(spinner, '布局计算完成');
    log.verbose(`布局结果: ${layout.nodes.length} 节点, ${layout.edges.length} 边`);

    // 6. 序列化为 .drawio 文件
    spinner = log.startSpinner('正在生成 draw.io 文件...');

    await serializeToFile(ir, layout, outputPath, { compact: true });

    log.stopSpinner(spinner, '文件生成完成');
    log.success(`已生成: ${outputPath}`);
    log.raw(`${outputPath}\n`); // quiet 模式下仍输出文件路径（可接管道）

    return 0;
  } catch (err: unknown) {
    log.stopSpinner(spinner);
    return handleError(err, log);
  } finally {
    // 恢复 env var，避免污染后续调用
    if (options.model) {
      if (prevModel === undefined) delete process.env['SPEAKDRAW_MODEL'];
      else process.env['SPEAKDRAW_MODEL'] = prevModel;
    }
  }
}

/**
 * 根据错误类型返回对应的退出码。
 */
function handleError(err: unknown, log: CliLogger): number {
  if (err instanceof LLMMissingKeyError) {
    log.error(`API Key 未配置: ${err.message}`);
    return 1;
  }
  if (err instanceof LLMInvalidInputError) {
    log.error(`输入无效: ${err.message}`);
    return 1;
  }
  if (err instanceof LLMUnreachableError || err instanceof LLMTimeoutError) {
    log.error(`LLM 服务不可达: ${err.message}`);
    return 2;
  }
  if (err instanceof LLMSchemaMismatchError) {
    log.error(`IR 校验失败: ${err.message}`);
    return 3;
  }
  // 未知错误
  log.error(`未知错误: ${(err as Error).message}`);
  return 2;
}

/** 获取 provider 对应的 API Key 环境变量名，用于提示 */
function getApiKeyEnvName(provider: string): string {
  const map: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    hunyuan: 'HUNYUAN_API_KEY',
  };
  return map[provider.toLowerCase()] ?? `${provider.toUpperCase()}_API_KEY`;
}
