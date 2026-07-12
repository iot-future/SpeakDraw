// packages/cli/src/commands/layout-only.ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { layoutDiagram, serializeToFile } from '@ai-diagram/core';
import { irDiagramSchema } from '@ai-diagram/shared';
import type { IRDiagram, Direction } from '@ai-diagram/shared';
import { createLogger } from '../utils/logger';

export interface LayoutOnlyOptions {
  /** 输出文件路径 */
  output?: string;
  /** 布局方向 */
  direction: 'LR' | 'TB';
  verbose: boolean;
  quiet: boolean;
}

/**
 * 执行 `ai-diagram layout-only` 命令。
 * 跳过 LLM 阶段，从 IR JSON 文件直接生成 .drawio。
 *
 * @param irFile - IR JSON 文件路径
 * @param options - 命令选项
 * @returns 退出码: 0=成功, 1=参数/文件错误
 */
export async function runLayoutOnly(irFile: string, options: LayoutOnlyOptions): Promise<number> {
  const log = createLogger({ verbose: options.verbose, quiet: options.quiet });

  // 1. 读取 IR JSON
  let raw: string;
  try {
    raw = await readFile(irFile, 'utf-8');
  } catch (cause) {
    log.error(`无法读取 IR 文件: ${irFile} — ${(cause as Error).message}`);
    return 1;
  }

  // 2. 解析并校验 JSON
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    log.error(`IR 文件不是合法的 JSON: ${irFile}`);
    return 1;
  }

  const parsed = irDiagramSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    log.error(`IR 校验失败:\n${issues}`);
    return 1;
  }

  const ir: IRDiagram = parsed.data;
  log.verbose(`IR: ${JSON.stringify(ir, null, 2)}`);

  // 3. 布局
  const spinner = log.startSpinner('正在计算自动布局...');
  try {
    const layout = await layoutDiagram(ir, { direction: options.direction as Direction });
    log.stopSpinner(spinner, '布局计算完成');

    // 4. 输出
    const outputPath = options.output ?? irFile.replace(/\.json$/i, '.drawio');
    await serializeToFile(ir, layout, resolve(outputPath), { compact: true });

    log.success(`已生成: ${outputPath}`);
    log.raw(`${outputPath}\n`);
    return 0;
  } catch (err) {
    log.stopSpinner(spinner);
    log.error(`布局失败: ${(err as Error).message}`);
    return 1;
  }
}
