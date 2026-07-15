// 向后兼容：重导出到新的序列化器实现
import type { IRDiagram, LayoutResult } from '@speakdraw/shared';
import { serialize } from './drawio-serializer.js';
import type { SerializeOptions } from './drawio-serializer.js';

export { serialize, SerializeOptions };

/**
 * @deprecated 使用 `serialize()` 代替。保留此导出仅为向后兼容。
 */
export function serializeToDrawioXml(
  ir: IRDiagram,
  layout: LayoutResult,
  options: SerializeOptions = {},
): string {
  return serialize(ir, layout, options);
}
