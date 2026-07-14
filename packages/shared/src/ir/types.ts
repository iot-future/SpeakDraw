/** 节点类型枚举 */
export type NodeType =
  'entity' | 'service' | 'decision' | 'process' | 'dataStore' | 'note' | 'actor' | 'generic';

/** 节点定义 */
export interface IRNode {
  /** 唯一标识（必填） */
  id: string;
  /** 显示标签（必填） */
  label: string;
  /** 多行标签（可选，按 \n 拆分后的行数组）。用于节点尺寸自适应估算。 */
  labelRows?: string[];
  /** 节点类型（必填） */
  type: NodeType;
  /** 所属分组 id（可选） */
  group?: string;
  /** 手动指定节点尺寸（可选），覆盖自动估算。width 和 height 均为可选，指定哪个用哪个。 */
  size?: { width?: number; height?: number };
  /** 扩展元数据（可选） */
  metadata?: Record<string, unknown>;
}

/** 边类型枚举 */
export type EdgeType =
  'association' | 'inheritance' | 'aggregation' | 'composition' | 'foreignKey' | 'flow';

/** ER 图关系基数（Crow's Foot Notation） */
export type Cardinality = '1' | '0..1' | '*' | '1..*' | '0..*';

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
  /** 源端基数（可选，仅 ER 图 foreignKey 边生效） */
  sourceCardinality?: Cardinality;
  /** 目标端基数（可选，仅 ER 图 foreignKey 边生效） */
  targetCardinality?: Cardinality;
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
