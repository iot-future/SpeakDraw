import { createLogger } from '../utils/logger.js';

export interface ExportOptions {
  /** 导出格式 */
  format: 'png' | 'svg';
  /** 输出路径 */
  output?: string;
  verbose: boolean;
  quiet: boolean;
}

/**
 * 执行 'speakdraw export` 命令。
 *
 * Phase 1 初始实现为占位，不实际渲染。
 * 后续 Phase 3 集成 diagrams.net docker 自托管渲染或客户端导出。
 *
 * @param filePath - .drawio 文件路径
 * @param options - 命令选项
 * @returns 退出码: 0=成功, 1=参数错误
 */
export async function runExport(filePath: string, options: ExportOptions): Promise<number> {
  const log = createLogger({ verbose: options.verbose, quiet: options.quiet });

  log.info(
    `导出功能将在 Phase 3 中通过自托管 diagrams.net docker 实现。\n` +
      `当前您可以: 用 draw.io 桌面版/网页版打开 ${filePath}，然后手动导出为 ${options.format.toUpperCase()}。`,
  );

  log.raw(`${filePath}\n`);
  return 0;
}
