import type { IRDiagram } from '@ai-diagram/shared';
import type { NodeStyleTemplate, EdgeStyleTemplate } from './style-templates';
import {
  NODE_STYLE_TEMPLATES,
  EDGE_STYLE_TEMPLATES,
  DEFAULT_NODE_STYLE,
  DEFAULT_EDGE_STYLE,
} from './style-templates';

/**
 * 将节点样式模板编译为 draw.io style 属性字符串。
 *
 * 输出格式：`shape=rectangle;rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;`
 *
 * @param template - 节点样式模板
 * @returns draw.io 兼容的 style 字符串
 */
export function compileNodeStyle(template: NodeStyleTemplate): string {
  const parts: string[] = [];

  parts.push(`shape=${template.shape}`);
  if (template.rounded !== undefined) parts.push(`rounded=${template.rounded}`);

  // whiteSpace：默认 "wrap"，模板可覆盖
  parts.push(`whiteSpace=${template.whiteSpaceWrap === false ? 'nowrap' : 'wrap'}`);

  // html：默认 1，模板可覆盖
  parts.push(`html=${template.html ?? 1}`);

  parts.push(`fillColor=${template.fillColor}`);
  parts.push(`strokeColor=${template.strokeColor}`);
  if (template.fontSize !== undefined) parts.push(`fontSize=${template.fontSize}`);
  if (template.fontFamily !== undefined) parts.push(`fontFamily=${template.fontFamily}`);
  if (template.extras) parts.push(template.extras);

  return parts.join(';') + ';';
}

/**
 * 编译边样式模板为 draw.io style 属性字符串。
 *
 * @param template - 边样式模板
 * @returns draw.io 兼容的 style 字符串
 */
export function compileEdgeStyle(template: EdgeStyleTemplate): string {
  const parts: string[] = [];

  parts.push(`edgeStyle=${template.edgeStyle}`);
  parts.push(`rounded=${template.rounded ?? 0}`);
  parts.push('orthogonalLoop=1');
  parts.push('jettySize=auto');
  parts.push('html=1');

  if (template.startArrow && template.startArrow !== 'none') {
    parts.push(`startArrow=${template.startArrow}`);
    if (template.startFill !== undefined) parts.push(`startFill=${template.startFill}`);
  }
  if (template.endArrow && template.endArrow !== 'none') {
    parts.push(`endArrow=${template.endArrow}`);
    if (template.endFill !== undefined) parts.push(`endFill=${template.endFill}`);
  }
  if (template.dashed === 1) parts.push('dashed=1');
  if (template.strokeColor) parts.push(`strokeColor=${template.strokeColor}`);
  if (template.strokeWidth) parts.push(`strokeWidth=${template.strokeWidth}`);
  if (template.fontSize !== undefined) parts.push(`fontSize=${template.fontSize}`);
  if (template.fontFamily !== undefined) parts.push(`fontFamily=${template.fontFamily}`);
  if (template.extras) parts.push(template.extras);

  return parts.join(';') + ';';
}

/**
 * 安全地从节点样式映射表取值，未知类型返回默认样式。
 */
function getNodeTemplate(nodeType: string): NodeStyleTemplate {
  if (nodeType in NODE_STYLE_TEMPLATES) {
    return NODE_STYLE_TEMPLATES[nodeType as keyof typeof NODE_STYLE_TEMPLATES];
  }
  return DEFAULT_NODE_STYLE;
}

/**
 * 安全地从边样式映射表取值，未知类型返回默认样式。
 */
function getEdgeTemplate(edgeType: string): EdgeStyleTemplate {
  if (edgeType in EDGE_STYLE_TEMPLATES) {
    return EDGE_STYLE_TEMPLATES[edgeType as keyof typeof EDGE_STYLE_TEMPLATES];
  }
  return DEFAULT_EDGE_STYLE;
}

/**
 * 根据节点类型应用样式，支持运行时覆盖。
 *
 * @param nodeType - 节点类型
 * @param overrides - 部分样式覆盖（可选）
 * @returns draw.io style 字符串
 */
export function applyNodeStyle(nodeType: string, overrides?: Partial<NodeStyleTemplate>): string {
  const template: NodeStyleTemplate = {
    ...getNodeTemplate(nodeType),
    ...overrides,
  };
  return compileNodeStyle(template);
}

/**
 * 根据边类型应用样式，支持运行时覆盖。
 *
 * @param edgeType - 边类型
 * @param overrides - 部分样式覆盖（可选）
 * @returns draw.io style 字符串
 */
export function applyEdgeStyle(edgeType: string, overrides?: Partial<EdgeStyleTemplate>): string {
  const template: EdgeStyleTemplate = {
    ...getEdgeTemplate(edgeType),
    ...overrides,
  };
  return compileEdgeStyle(template);
}

/**
 * 同 group 节点同色系调色板（对齐 PRD S3-05）。
 * 为每个 group 分配基色，组内节点按索引递增亮度。
 */
const GROUP_COLOR_SCHEME: Array<{ fill: string; stroke: string }> = [
  { fill: '#dae8fc', stroke: '#6c8ebf' }, // 蓝色系
  { fill: '#d5e8d4', stroke: '#82b366' }, // 绿色系
  { fill: '#fff2cc', stroke: '#d6b656' }, // 橙色系
  { fill: '#e1d5e7', stroke: '#9673a6' }, // 紫色系
  { fill: '#f8cecc', stroke: '#b85450' }, // 红色系
  { fill: '#ffe6cc', stroke: '#d79b00' }, // 黄色系
];

/**
 * 根据 IR 构建节点 id → draw.io style 字符串的映射。
 * 处理 group 同色系逻辑（S3-05）。
 *
 * @param ir - 中间表示图
 * @param customTemplates - 自定义样式模板覆盖（可选，合并到默认模板之上）
 * @returns Map<nodeId, styleString>
 */
export function buildNodeStyleMap(
  ir: IRDiagram,
  customTemplates?: Partial<Record<string, Partial<NodeStyleTemplate>>>,
): Map<string, string> {
  const styleMap = new Map<string, string>();

  // 收集所有 group
  const groupIds = new Set<string>();
  for (const node of ir.nodes) {
    if (node.group) groupIds.add(node.group);
  }

  // 为 group 分配色系
  const groupColors = new Map<string, { fill: string; stroke: string }>();
  let colorIdx = 0;
  for (const gid of groupIds) {
    const scheme = GROUP_COLOR_SCHEME[colorIdx % GROUP_COLOR_SCHEME.length]!;
    groupColors.set(gid, scheme);
    colorIdx++;
  }

  for (const node of ir.nodes) {
    const overrides: Partial<NodeStyleTemplate> =
      customTemplates?.[node.id] ??
      (node.group && groupColors.has(node.group)
        ? {
            fillColor: groupColors.get(node.group)!.fill,
            strokeColor: groupColors.get(node.group)!.stroke,
          }
        : {});

    styleMap.set(node.id, applyNodeStyle(node.type, overrides));
  }

  return styleMap;
}

/**
 * 根据 IR 构建边 id → draw.io style 字符串的映射。
 *
 * @param ir - 中间表示图
 * @param customTemplates - 自定义边样式覆盖（可选）
 * @returns Map<edgeId, styleString>
 */
export function buildEdgeStyleMap(
  ir: IRDiagram,
  customTemplates?: Partial<Record<string, Partial<EdgeStyleTemplate>>>,
): Map<string, string> {
  const styleMap = new Map<string, string>();

  for (const edge of ir.edges) {
    const overrides = customTemplates?.[edge.id];
    styleMap.set(edge.id, applyEdgeStyle(edge.type, overrides));
  }

  return styleMap;
}
