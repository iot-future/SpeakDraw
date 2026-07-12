/** 节点类型枚举 */
export type NodeType =
  'entity' | 'service' | 'decision' | 'process' | 'dataStore' | 'note' | 'actor' | 'generic';

/** 节点定义 */
export interface IRNode {
  /** 唯一标识（必填） */
  id: string;
  /** 显示标签（必填） */
  label: string;
  /** 节点类型（必填） */
  type: NodeType;
  /** 所属分组 id（可选） */
  group?: string;
  /** 扩展元数据（可选） */
  metadata?: Record<string, unknown>;
}

/** 边类型枚举 */
export type EdgeType =
  'association' | 'inheritance' | 'aggregation' | 'composition' | 'foreignKey' | 'flow';

/** 边定义 */
export interface IREdge {
  /** 唯一标识（必填） */
  id: string;
  /** 源节点 id（必填） */
  source: string;
  /** 目标节点 id（必填） */
  target: string;
  /** 边标签（可选） */
  label?: string;
  /** 边类型（必填） */
  type: EdgeType;
  /** 扩展元数据（可选） */
  metadata?: Record<string, unknown>;
}

/** 分组类型枚举 */
export type GroupType = 'container' | 'swimlane' | 'layer';

/** 分组定义 */
export interface IRGroup {
  /** 唯一标识（必填） */
  id: string;
  /** 显示标签（必填） */
  label: string;
  /** 分组类型（必填） */
  type: GroupType;
}

/** 图类型枚举 */
export type DiagramType = 'er' | 'flowchart';

/** 布局方向枚举 */
export type Direction = 'LR' | 'TB' | 'RL' | 'BT';

/** 图顶层结构 */
export interface IRDiagram {
  /** 图类型（必填） */
  type: DiagramType;
  /** 布局方向（必填） */
  direction: Direction;
  /** 节点列表（必填） */
  nodes: IRNode[];
  /** 边列表（必填） */
  edges: IREdge[];
  /** 分组列表（可选） */
  groups?: IRGroup[];
}
