import type { Direction } from '../ir/types';

/** ELK 端口方向 */
export type PortSide = 'NORTH' | 'SOUTH' | 'WEST' | 'EAST';

/**
 * 布局后的节点（中心点坐标系）。
 * 中心点 (x, y) + 尺寸 (width, height) → bbox 四角可推导：
 * left = x - width/2, top = y - height/2, right = x + width/2, bottom = y + height/2
 */
export interface LayoutNode {
  /** 节点 id，与 IRNode.id 一致 */
  id: string;
  /** 中心点 x 坐标 */
  x: number;
  /** 中心点 y 坐标 */
  y: number;
  /** 节点宽度 */
  width: number;
  /** 节点高度 */
  height: number;
}

/**
 * 布局后的边（含端口映射信息）。
 * 路由点（bendPoints）为中间折线控制点，不含起点/终点。
 * sourcePort/targetPort 指示 ELK 选择的出入端口方向，
 * 用于映射到 draw.io 的 exitX/exitY/entryX/entryY。
 */
export interface LayoutEdge {
  /** 边 id，与 IREdge.id 一致 */
  id: string;
  /** 源节点 id */
  source: string;
  /** 目标节点 id */
  target: string;
  /** 路由中间折线点列表（不含起点/终点） */
  bendPoints: Array<{ x: number; y: number }>;
  /** ELK 选择的源端口方向（可选，无端口约束时为 undefined） */
  sourcePort?: PortSide;
  /** ELK 选择的目标端口方向（可选） */
  targetPort?: PortSide;
  /** 源端口在多端口节点该边上的索引（0-based，可选） */
  sourcePortIndex?: number;
  /** 目标端口索引（可选） */
  targetPortIndex?: number;
}

/**
 * 完整的布局结果。
 * 画布总尺寸 (width, height) 为所有节点的最小包围矩形 + padding。
 */
export interface LayoutResult {
  /** 布局后的节点列表 */
  nodes: LayoutNode[];
  /** 布局后的边列表 */
  edges: LayoutEdge[];
  /** 画布总宽度（所有节点 bbox + padding） */
  width: number;
  /** 画布总高度 */
  height: number;
}

/**
 * 布局配置选项。
 * 所有字段可选，未提供时使用默认值。
 */
export interface LayoutOptions {
  /** 布局方向，默认由 IR.direction 决定 */
  direction?: Direction;
  /** 节点间水平间距（px），默认 50 */
  spacingNodeNode?: number;
  /** 节点间垂直间距（px），默认 50 */
  spacingEdgeNode?: number;
  /** 边与边间距（px），默认 10 */
  spacingEdgeEdge?: number;
  /** 层间间距（px），默认 60 */
  spacingBetweenLayers?: number;
  /** 画布边距（px），默认 40 */
  padding?: number;
  /** 手动指定节点尺寸覆盖（key=nodeId），用于精确控制关键节点 */
  nodeSizeOverrides?: Record<string, { width: number; height: number }>;
  /** 默认节点最小宽高，默认 [120, 60] */
  defaultNodeSize?: { width: number; height: number };
  /** 字号（px），用于标签长度估算，默认 14 */
  fontSize?: number;
  /** 字符平均宽度系数，默认 0.6 */
  charWidthFactor?: number;
  /** 标签 padding（px），默认 20 */
  labelPadding?: number;
  /** 节点最大宽高限制 [maxW, maxH]，默认 [400, 200] */
  maxNodeSize?: { width: number; height: number };
}
