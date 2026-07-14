import type { NodeType, EdgeType, GroupType, Cardinality } from '@ai-diagram/shared';

/**
 * 分组容器样式模板（对齐 PRD S3-06）。
 */
export interface GroupStyleTemplate {
  /** 形状名称（'rectangle', 'swimlane'） */
  shape: string;
  /** 填充颜色 */
  fillColor: string;
  /** 边框颜色 */
  strokeColor: string;
  /** 是否虚线 */
  dashed?: 0 | 1;
  /** 是否圆角 */
  rounded?: 0 | 1;
  /** 字号 */
  fontSize?: number;
  /** 字体族 */
  fontFamily?: string;
  /** 额外 style 属性 */
  extras?: string;
}

/**
 * 分组类型 → 容器样式模板。
 *
 * | type      | shape     | 说明               |
 * |-----------|-----------|--------------------|
 * | container | rectangle | 虚线圆角矩形，标签左上 |
 * | swimlane  | swimlane  | 泳道，标题栏 30px     |
 * | layer     | rectangle | 透明/半透明，仅虚线边框 |
 */
export const GROUP_STYLE_TEMPLATES: Record<GroupType, GroupStyleTemplate> = {
  container: {
    shape: 'rectangle',
    fillColor: '#F0F4FF',
    strokeColor: '#6c8ebf',
    dashed: 1,
    rounded: 1,
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;',
  },
  swimlane: {
    shape: 'swimlane',
    fillColor: '#F5F5F5',
    strokeColor: '#666666',
    fontSize: 13,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'startSize=30;horizontal=0;',
  },
  layer: {
    shape: 'rectangle',
    fillColor: 'none',
    strokeColor: '#CCCCCC',
    dashed: 1,
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'align=left;verticalAlign=top;spacingLeft=10;spacingTop=5;opacity=30;',
  },
};

/**
 * 节点样式模板。
 * 所有字段均为 draw.io style 字符串的组成片段。
 */
export interface NodeStyleTemplate {
  /** 形状名称（如 'rectangle', 'rhombus', 'cylinder3', 'note', 'umlActor'） */
  shape: string;
  /** 填充颜色 (hex, 如 '#dae8fc') */
  fillColor: string;
  /** 边框颜色 (hex, 如 '#6c8ebf') */
  strokeColor: string;
  /** 是否圆角 (0/1) */
  rounded?: 0 | 1;
  /** 是否 html 渲染 */
  html?: 1;
  /** 是否自动换行 */
  whiteSpaceWrap?: boolean;
  /** 额外 style 属性，追加到 style 字符串末尾 */
  extras?: string;
  /** 字号，默认 12 */
  fontSize?: number;
  /** 字体族，默认 'Helvetica,Sans-serif' */
  fontFamily?: string;
}

/**
 * 边样式模板。
 */
export interface EdgeStyleTemplate {
  /** 边路由风格 */
  edgeStyle: string;
  /** 源端箭头形状 ('classic', 'block', 'diamond', 'none') */
  startArrow?: string;
  /** 目标端箭头形状 */
  endArrow?: string;
  /** 源端箭头是否填充 (0/1) */
  startFill?: 0 | 1;
  /** 目标端箭头是否填充 (0/1) */
  endFill?: 0 | 1;
  /** 是否虚线 (0/1) */
  dashed?: 0 | 1;
  /** 线条颜色 (hex) */
  strokeColor?: string;
  /** 线条宽度 */
  strokeWidth?: number;
  /** 是否圆角 */
  rounded?: 0 | 1;
  /** 额外 style 属性 */
  extras?: string;
  /** 字号 */
  fontSize?: number;
  /** 字体族 */
  fontFamily?: string;
}

/**
 * 节点类型 → 默认样式模板（对齐 PRD S3-01）。
 *
 * | type       | shape       | fillColor | strokeColor | 说明                        |
 * |------------|-------------|-----------|-------------|-----------------------------|
 * | entity     | rectangle   | #dae8fc   | #6c8ebf     | 浅蓝底，表头加粗（见 S3-01）|
 * | service    | rect(rounded)|#d5e8d4   | #82b366     | 圆角矩形，浅绿底            |
 * | decision   | rhombus     | #fff2cc   | #d6b656     | 菱形，浅橙底                |
 * | process    | rect(rounded)|#ffffff   | #000000     | 矩形，白底（PRD 明确）      |
 * | dataStore  | cylinder3   | #e1d5e7   | #9673a6     | 圆柱形，灰底                |
 * | note       | note        | #ffe6cc   | #d79b00     | 折角矩形，黄底              |
 * | actor      | umlActor    | #f5f5f5   | #666666     | 人形图标                    |
 * | generic    | rectangle   | #ffffff   | #000000     | 矩形，白底黑框              |
 */
export const NODE_STYLE_TEMPLATES: Record<NodeType, NodeStyleTemplate> = {
  entity: {
    shape: 'rectangle',
    fillColor: '#dae8fc',
    strokeColor: '#6c8ebf',
    rounded: 0,
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
  },
  service: {
    shape: 'rectangle',
    fillColor: '#d5e8d4',
    strokeColor: '#82b366',
    rounded: 1,
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
  },
  decision: {
    shape: 'rhombus',
    fillColor: '#fff2cc',
    strokeColor: '#d6b656',
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
  },
  process: {
    shape: 'rectangle',
    fillColor: '#ffffff',
    strokeColor: '#000000',
    rounded: 1,
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
  },
  dataStore: {
    shape: 'cylinder3',
    fillColor: '#e1d5e7',
    strokeColor: '#9673a6',
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'boundedLbl=1;size=10;',
  },
  note: {
    shape: 'note',
    fillColor: '#ffe6cc',
    strokeColor: '#d79b00',
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'backgroundOutline=1;darkOpacity=0.05;size=20;',
  },
  actor: {
    shape: 'umlActor',
    fillColor: '#f5f5f5',
    strokeColor: '#666666',
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
    extras: 'verticalLabelPosition=bottom;verticalAlign=top;outlineConnect=0;',
  },
  generic: {
    shape: 'rectangle',
    fillColor: '#ffffff',
    strokeColor: '#000000',
    rounded: 0,
    fontSize: 12,
    fontFamily: 'Helvetica,Sans-serif',
  },
};

/**
 * 边类型 → 默认样式模板（对齐 PRD S3-02）。
 *
 * | type        | endArrow  | dashed | strokeColor | 说明           |
 * |-------------|-----------|--------|-------------|----------------|
 * | foreignKey  | none      | 1      | #666666     | 深灰虚线，1..N  |
 * | inheritance | block(0)  | 0      | —           | 白三角箭头+实线 |
 * | flow        | classic   | 0      | —           | 蓝箭头+实线     |
 * | association | classic   | 0      | —           | 黑箭头+实线     |
 * | aggregation | diamond(0)| 0      | —           | 白菱形+实线     |
 * | composition | diamond(1)| 0      | —           | 黑菱形+实线     |
 */
export const EDGE_STYLE_TEMPLATES: Record<EdgeType, EdgeStyleTemplate> = {
  association: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'classic',
    endFill: 1,
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
  inheritance: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'block',
    endFill: 0,
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
  aggregation: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'diamond',
    endFill: 0,
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
  composition: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'diamond',
    endFill: 1,
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
  foreignKey: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'none',
    dashed: 1,
    strokeColor: '#666666',
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
  flow: {
    edgeStyle: 'orthogonalEdgeStyle',
    endArrow: 'classic',
    endFill: 1,
    strokeColor: '#0066CC',
    rounded: 0,
    fontSize: 11,
    fontFamily: 'Helvetica,Sans-serif',
  },
};

/**
 * 默认节点样式（未匹配时回退）。
 */
export const DEFAULT_NODE_STYLE: NodeStyleTemplate = NODE_STYLE_TEMPLATES.generic;

/**
 * 默认边样式（未匹配时回退）。
 */
export const DEFAULT_EDGE_STYLE: EdgeStyleTemplate = EDGE_STYLE_TEMPLATES.association;

/**
 * draw.io Entity Relation 库 Crow's Foot 端点标记名称。
 *
 * 这些 marker 名称对应 draw.io 内置的 "Entity Relation" 形状库中的
 * Crow's Foot 端点样式。在 mxCell style 中作为 `startArrow` / `endArrow` 使用。
 */
export type CardinalityMarker = 'ERone' | 'ERmany' | 'ERzeroToOne' | 'ERoneToMany' | 'ERzeroToMany';

/** ER 图专用边路由风格（draw.io entityRelationEdgeStyle 不使用 bendPoints）。 */
export const ER_EDGE_STYLE = 'entityRelationEdgeStyle' as const;

/**
 * 基数 → draw.io ER 标记映射表。
 *
 * | 基数   | Marker          | 视觉表现       |
 * |--------|-----------------|---------------|
 * | 1      | ERone           | 竖线           |
 * | 0..1   | ERzeroToOne     | 圆圈 + 竖线    |
 * | *      | ERmany          | 三叉爪印       |
 * | 1..*   | ERoneToMany     | 竖线 + 爪印    |
 * | 0..*   | ERzeroToMany    | 圆圈 + 爪印    |
 */
export const CARDINALITY_TO_MARKER: Record<Cardinality, CardinalityMarker> = {
  '1': 'ERone',
  '0..1': 'ERzeroToOne',
  '*': 'ERmany',
  '1..*': 'ERoneToMany',
  '0..*': 'ERzeroToMany',
};
