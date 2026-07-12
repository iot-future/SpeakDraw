import type { IRDiagram } from '@ai-diagram/shared';
import type { ELKLayoutResult } from '../layout/elk-prototype';

/** 节点类型 → draw.io style 简单映射 */
const STYLE_MAP: Record<string, string> = {
  entity: 'shape=rectangle;rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;',
  service:
    'shape=rectangle;rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;',
  decision: 'shape=rhombus;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;',
  process:
    'shape=rectangle;rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;',
  dataStore:
    'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;fillColor=#e1d5e7;strokeColor=#9673a6;size=10;',
  note: 'shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#ffe6cc;strokeColor=#d79b00;size=20;',
  actor:
    'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;fillColor=#f5f5f5;strokeColor=#666666;',
  generic:
    'shape=rectangle;rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;',
};

/** 边类型 → draw.io edge style 映射 */
const EDGE_STYLE_MAP: Record<string, string> = {
  association: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;',
  inheritance:
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=0;',
  aggregation:
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=diamond;endFill=0;',
  composition:
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=diamond;endFill=1;',
  foreignKey:
    'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;dashed=1;strokeColor=#666666;',
  flow: 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;',
};

/** 序列化选项 */
export interface SerializeOptions {
  /** mxfile 的 modified 时间戳来源，默认当前时间；测试注入固定值以稳定快照 */
  now?: Date;
}

/**
 * 将 IR + ELK 布局结果序列化为 draw.io mxGraphModel XML 字符串。
 */
export function serializeToDrawioXml(
  ir: IRDiagram,
  layout: ELKLayoutResult,
  options: SerializeOptions = {},
): string {
  const nodeStyleMap = new Map(ir.nodes.map((n) => [n.id, n.type]));
  const edgeStyleMap = new Map(ir.edges.map((e) => [e.id, e.type]));
  const nodeLabelMap = new Map(ir.nodes.map((n) => [n.id, n.label]));
  const edgeLabelMap = new Map(ir.edges.filter((e) => e.label).map((e) => [e.id, e.label!]));

  const cells: string[] = [];

  // 根 cell id=0
  cells.push('        <mxCell id="0" />');

  // 父容器 cell id=1
  cells.push('        <mxCell id="1" parent="0" />');

  // 节点 cell
  for (const node of layout.nodes) {
    const style = STYLE_MAP[nodeStyleMap.get(node.id) ?? 'generic'] ?? STYLE_MAP.generic!;
    const label = escapeXml(nodeLabelMap.get(node.id) ?? node.id);
    cells.push(
      `        <mxCell id="${escapeXml(node.id)}" value="${label}" style="${style}" vertex="1" parent="1">`,
    );
    cells.push(
      `          <mxGeometry x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" as="geometry" />`,
    );
    cells.push('        </mxCell>');
  }

  // 边 cell
  for (const edge of layout.edges) {
    const style =
      EDGE_STYLE_MAP[edgeStyleMap.get(edge.id) ?? 'association'] ?? EDGE_STYLE_MAP.association!;
    const label = edgeLabelMap.get(edge.id);
    const valueAttr = label ? ` value="${escapeXml(label)}"` : '';

    cells.push(
      `        <mxCell id="${escapeXml(edge.id)}"${valueAttr} style="${style}" edge="1" parent="1" source="${escapeXml(edge.source)}" target="${escapeXml(edge.target)}">`,
    );

    if (edge.bendPoints.length > 0) {
      cells.push('          <mxGeometry relative="1" as="geometry">');
      cells.push('            <Array as="points">');
      for (const bp of edge.bendPoints) {
        cells.push(`              <mxPoint x="${bp.x}" y="${bp.y}" />`);
      }
      cells.push('            </Array>');
      cells.push('          </mxGeometry>');
    } else {
      cells.push('          <mxGeometry relative="1" as="geometry" />');
    }

    cells.push('        </mxCell>');
  }

  const modified = (options.now ?? new Date()).toISOString();

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<mxfile host="ai-diagram" version="1.0" modified="${modified}" agent="ai-diagram" type="device">`,
    '  <diagram id="diagram-1" name="Page-1">',
    '    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">',
    '      <root>',
    ...cells,
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
    '',
  ].join('\n');

  return xml;
}

/** 转义 XML 特殊字符 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
