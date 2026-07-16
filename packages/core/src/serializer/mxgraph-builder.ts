import { mapPortToDrawio } from '../layout/port-mapping.js';
import type { PortSide } from '@speakdraw/shared';

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
    .replace(/'/g, '&apos;')
    .replace(/\n/g, '&#xa;'); // 换行 → draw.io XML 实体，必须在 & 转义之后
}

/** Emoji → 纯文本替换映射，用于 draw.io 兼容（PRD AC-06） */
const EMOJI_REPLACEMENTS: Record<string, string> = {
  '🔑': '[PK]',
  '🔒': '[LOCK]',
  '🔗': '[LINK]',
};

/** Unicode 制表分隔线模式（6 个及以上连续字符视为分隔线） */
const SEPARATOR_PATTERN = /[─━]{6,}/g;

/** draw.io html=1 渲染模式下的水平分隔线 HTML 标签 */
const SEPARATOR_HTML = '<hr size="1" noshade="noshade">';

/**
 * 准备 draw.io 节点标签值。
 * 三步处理管线：emoji 文本替换 → XML 转义（含换行） → 分隔线 HTML 注入。
 *
 * 注意顺序是关键：分隔线替换必须在 XML 转义之后，
 * 否则 `<hr>` 会被 `escapeXml()` 转义为 `&lt;hr&gt;` 而失效。
 *
 * @param rawLabel - IR 中的原始标签文本
 * @returns draw.io mxCell value 属性可用的标签字符串
 */
export function prepareLabel(rawLabel: string): string {
  // Step 1: Emoji 替换（纯文本，在 XML 转义前）
  let label = rawLabel;
  for (const [emoji, replacement] of Object.entries(EMOJI_REPLACEMENTS)) {
    label = label.replaceAll(emoji, replacement);
  }

  // Step 2: XML 转义（含 \n → &#xa;）
  label = escapeXml(label);

  // Step 3: 分隔线替换（在 XML 转义后，<hr> 保持原样不被转义）
  label = label.replace(SEPARATOR_PATTERN, SEPARATOR_HTML);

  return label;
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
 * 构建分组容器 mxCell XML（对齐 PRD S3-06）。
 * 容器使用 `container="1"` 属性，draw.io 会自动将其子节点（parent 指向此容器）
 * 视为容器内容，支持折叠/展开。
 *
 * @param id - 容器唯一标识（即 IRGroup.id）
 * @param label - 容器标题
 * @param style - draw.io style 属性字符串
 * @param x - 左上角 x 坐标
 * @param y - 左上角 y 坐标
 * @param width - 容器宽度（子节点包围盒 + padding）
 * @param height - 容器高度（子节点包围盒 + padding）
 * @param parent - 父 cell id，默认 "1"
 * @returns mxCell XML 行数组
 */
export function buildContainerCell(
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
    `        <mxCell id="${escapeXml(id)}" value="${prepareLabel(label)}" style="${escapeXml(style)}" vertex="1" container="1" parent="${escapeXml(parent)}">`,
    `          <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />`,
    '        </mxCell>',
  ];
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
    `        <mxCell id="${escapeXml(id)}" value="${prepareLabel(label)}" style="${escapeXml(style)}" vertex="1" parent="${escapeXml(parent)}">`,
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
 * @param sourcePortIndex - 源端口在多端口节点该边上的索引（0-based，可选）
 * @param targetPortIndex - 目标端口索引（可选）
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
  sourcePortIndex?: number,
  targetPortIndex?: number,
  labelOffsetY?: number,
): string[] {
  const lines: string[] = [];

  // entityRelationEdgeStyle 边不使用 port 属性和 bendPoints
  const isEREdge = style.includes('entityRelationEdgeStyle');

  // 构建属性
  const valueAttr = label ? ` value="${prepareLabel(label)}"` : '';

  // Port 映射属性（ER 边跳过，draw.io 自动处理端口）
  let portAttrStr = '';
  if (!isEREdge) {
    const portAttrs: string[] = [];
    if (sourcePort) {
      const src = mapPortToDrawio(sourcePort, true, sourcePortIndex);
      if (src.exitX !== undefined) portAttrs.push(`exitX="${src.exitX}"`);
      if (src.exitY !== undefined) portAttrs.push(`exitY="${src.exitY}"`);
    }
    if (targetPort) {
      const tgt = mapPortToDrawio(targetPort, false, targetPortIndex);
      if (tgt.entryX !== undefined) portAttrs.push(`entryX="${tgt.entryX}"`);
      if (tgt.entryY !== undefined) portAttrs.push(`entryY="${tgt.entryY}"`);
    }
    portAttrStr = portAttrs.length > 0 ? ` ${portAttrs.join(' ')}` : '';
  }

  lines.push(
    `        <mxCell id="${escapeXml(id)}"${valueAttr} style="${escapeXml(style)}" edge="1" parent="${escapeXml(parent)}" source="${escapeXml(source)}" target="${escapeXml(target)}"${portAttrStr}>`,
  );

  // ER 边使用简单 geometry，不需要 bendPoints
  if (isEREdge) {
    lines.push('          <mxGeometry relative="1" as="geometry" />');
  } else if (bendPoints.length > 0) {
    lines.push('          <mxGeometry relative="1" as="geometry">');
    if (labelOffsetY !== undefined && labelOffsetY !== 0) {
      lines.push(`            <mxPoint x="0" y="${labelOffsetY}" as="offset" />`);
    }
    lines.push('            <Array as="points">');
    for (const bp of bendPoints) {
      lines.push(`              <mxPoint x="${Math.round(bp.x)}" y="${Math.round(bp.y)}" />`);
    }
    lines.push('            </Array>');
    lines.push('          </mxGeometry>');
  } else if (labelOffsetY !== undefined && labelOffsetY !== 0) {
    lines.push('          <mxGeometry relative="1" as="geometry">');
    lines.push(`            <mxPoint x="0" y="${labelOffsetY}" as="offset" />`);
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
      `<mxfile host="speakdraw" modified="${modified}" agent="speakdraw" type="device">`,
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
    `<mxfile host="speakdraw" modified="${modified}" agent="speakdraw" type="device">`,
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
