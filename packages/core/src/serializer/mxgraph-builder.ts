import { mapPortToDrawio } from '../layout/port-mapping';
import type { PortSide } from '@ai-diagram/shared';

/**
 * 转义 XML 特殊字符（`<` `>` `&` `"` `'`）。
 * 对齐 PRD S3-12。
 *
 * @param str - 原始字符串
 * @returns XML 安全字符串
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 构建 mxGraphModel 的根 cell（id=0 和 id=1）。
 * draw.io 要求必须有这两个基础 cell（对齐 PRD S3-07）。
 *
 * @returns 根 cell XML 行数组
 */
export function buildRootCells(): string[] {
  return ['        <mxCell id="0" />', '        <mxCell id="1" parent="0" />'];
}

/**
 * 构建节点 mxCell XML。
 * PRD S3-08：每个 LayoutNode → `<mxCell vertex="1">` + `<mxGeometry>`。
 *
 * @param id - 节点唯一标识
 * @param label - 显示标签
 * @param style - draw.io style 属性字符串
 * @param x - draw.io 左上角 x 坐标（从中心点换算）
 * @param y - draw.io 左上角 y 坐标
 * @param width - 节点宽度
 * @param height - 节点高度
 * @param parent - 父 cell id，默认 "1"（图层根）（PRD S3-10）
 * @returns mxCell XML 行数组（含子 mxGeometry）
 */
export function buildNodeCell(
  id: string,
  label: string,
  style: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parent = '1',
): string[] {
  return [
    `        <mxCell id="${escapeXml(id)}" value="${escapeXml(label)}" style="${escapeXml(style)}" vertex="1" parent="${escapeXml(parent)}">`,
    `          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />`,
    '        </mxCell>',
  ];
}

/**
 * 构建边 mxCell XML。
 * PRD S3-09：每个 LayoutEdge → `<mxCell edge="1">` + exitX/exitY/entryX/entryY + bendPoints。
 *
 * @param id - 边唯一标识
 * @param label - 边标签（可选）
 * @param style - draw.io style 属性字符串
 * @param source - 源节点 id
 * @param target - 目标节点 id
 * @param bendPoints - ELK 输出的路由折线点
 * @param sourcePort - ELK 源端口方向（可选）
 * @param targetPort - ELK 目标端口方向（可选）
 * @param parent - 父 cell id，默认 "1"（PRD S3-10）
 * @returns mxCell XML 行数组
 */
export function buildEdgeCell(
  id: string,
  label: string | undefined,
  style: string,
  source: string,
  target: string,
  bendPoints: Array<{ x: number; y: number }>,
  sourcePort?: PortSide,
  targetPort?: PortSide,
  parent = '1',
): string[] {
  const lines: string[] = [];

  // 构建属性
  const valueAttr = label ? ` value="${escapeXml(label)}"` : '';

  // Port 映射属性
  const portAttrs: string[] = [];
  if (sourcePort) {
    const src = mapPortToDrawio(sourcePort, true);
    if (src.exitX !== undefined) portAttrs.push(`exitX="${src.exitX}"`);
    if (src.exitY !== undefined) portAttrs.push(`exitY="${src.exitY}"`);
  }
  if (targetPort) {
    const tgt = mapPortToDrawio(targetPort, false);
    if (tgt.entryX !== undefined) portAttrs.push(`entryX="${tgt.entryX}"`);
    if (tgt.entryY !== undefined) portAttrs.push(`entryY="${tgt.entryY}"`);
  }
  const portAttrStr = portAttrs.length > 0 ? ` ${portAttrs.join(' ')}` : '';

  lines.push(
    `        <mxCell id="${escapeXml(id)}"${valueAttr} style="${escapeXml(style)}" edge="1" parent="${escapeXml(parent)}" source="${escapeXml(source)}" target="${escapeXml(target)}"${portAttrStr}>`,
  );

  if (bendPoints.length > 0) {
    lines.push('          <mxGeometry relative="1" as="geometry">');
    lines.push('            <Array as="points">');
    for (const bp of bendPoints) {
      lines.push(`              <mxPoint x="${Math.round(bp.x)}" y="${Math.round(bp.y)}" />`);
    }
    lines.push('            </Array>');
    lines.push('          </mxGeometry>');
  } else {
    lines.push('          <mxGeometry relative="1" as="geometry" />');
  }

  lines.push('        </mxCell>');

  return lines;
}

/**
 * 包围 mxGraphModel 的完整 XML 结构。
 * PRD S3-11：pretty 模式（多行缩进）为默认；压缩模式通过 compact 选项。
 *
 * @param cells - 所有 cell XML 行
 * @param options - 序列化选项
 * @returns 完整 mxGraphModel XML 字符串
 */
export function wrapMxGraphModel(
  cells: string[],
  options: { now?: Date; diagramId?: string; diagramName?: string; compact?: boolean } = {},
): string {
  const modified = (options.now ?? new Date()).toISOString();

  if (options.compact) {
    // 压缩为单行（.drawio 标准格式），去除 cell 行前导/尾随空白
    const trimmedCells = cells.map((c) => c.trim());
    const body = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<mxfile host="ai-diagram" modified="${modified}" agent="ai-diagram" type="device">`,
      `<diagram id="${options.diagramId ?? 'diagram-1'}" name="${escapeXml(options.diagramName ?? 'Page-1')}">`,
      '<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">',
      '<root>',
      trimmedCells.join(''),
      '</root>',
      '</mxGraphModel>',
      '</diagram>',
      '</mxfile>',
    ].join('');
    return body;
  }

  // Pretty 模式（默认）
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<mxfile host="ai-diagram" modified="${modified}" agent="ai-diagram" type="device">`,
    `  <diagram id="${options.diagramId ?? 'diagram-1'}" name="${escapeXml(options.diagramName ?? 'Page-1')}">`,
    '    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">',
    '      <root>',
    ...cells,
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
    '',
  ].join('\n');
}
