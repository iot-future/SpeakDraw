import { readFile } from 'node:fs/promises';
import { StaticValidatorImpl } from '@speakdraw/core';
import { createLogger } from '../utils/logger';

export interface ValidateOptions {
  verbose: boolean;
  quiet: boolean;
  /** AABB 容忍误差（px） */
  tolerance?: number;
  /** 是否启用标签溢出检测 */
  enableLabelCheck?: boolean;
}

/**
 * 执行 'speakdraw validate` 命令。
 *
 * @param filePath - .drawio 文件路径
 * @param options - 命令选项
 * @returns 退出码: 0=通过, 1=参数/文件错误, 4=几何校验冲突
 */
export async function runValidate(filePath: string, options: ValidateOptions): Promise<number> {
  const log = createLogger({ verbose: options.verbose, quiet: options.quiet });

  // 1. 读取文件
  let xml: string;
  try {
    xml = await readFile(filePath, 'utf-8');
  } catch (cause) {
    log.error(`无法读取文件: ${filePath} — ${(cause as Error).message}`);
    return 1;
  }

  if (!xml.trim()) {
    log.error(`文件为空: ${filePath}`);
    return 1;
  }

  // 2. 执行校验
  log.info(`正在校验: ${filePath}`);
  const validator = new StaticValidatorImpl();
  const report = validator.validate(xml, {
    tolerance: options.tolerance,
    enableLabelCheck: options.enableLabelCheck,
  });

  // 3. 输出结果
  if (report.passed) {
    log.success('校验通过 — 无几何冲突');
    return 0;
  }

  log.warn(`发现 ${report.conflicts.length} 个冲突`);

  for (const c of report.conflicts) {
    const prefix = c.severity === 'error' ? '  ✗' : '  ⚠';
    log.info(`${prefix} [${c.type}] ${c.message} (${c.elements.join(', ')})`);
  }

  log.verbose(`详细报告:\n${report.summary}`);
  return 4;
}
