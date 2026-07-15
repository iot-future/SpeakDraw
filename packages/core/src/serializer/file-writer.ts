import { writeFile } from 'node:fs/promises';
import type { IRDiagram, LayoutResult } from '@speakdraw/shared';
import { AppError } from '@speakdraw/shared';
import { serialize } from './drawio-serializer.js';
import type { SerializeOptions } from './drawio-serializer.js';

/**
 * 序列化 IR + 布局结果为 .drawio 文件。
 * 默认压缩输出（.drawio 标准格式：单行 XML）。
 * PRD S3-14。
 *
 * @param ir - 中间表示图
 * @param layout - ELK 布局结果
 * @param filePath - 输出文件路径（如 `/path/to/output.drawio`）
 * @param options - 序列化选项
 * @throws AppError 当文件写入失败时（权限不足/磁盘满/路径无效）
 */
export async function serializeToFile(
  ir: IRDiagram,
  layout: LayoutResult,
  filePath: string,
  options: SerializeOptions = {},
): Promise<void> {
  // 文件输出默认压缩（PRD S3-14："自动压缩 XML"）
  const xml = serialize(ir, layout, { ...options, compact: options.compact ?? true });

  try {
    await writeFile(filePath, xml, 'utf-8');
  } catch (cause: unknown) {
    throw new AppError(
      `Failed to write .drawio file: ${filePath}`,
      'SERIALIZE_FILE_WRITE_ERROR',
      500,
      cause,
    );
  }
}
