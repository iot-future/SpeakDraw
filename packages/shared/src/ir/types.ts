/** Node type enum */
export type NodeType =
  'entity' | 'service' | 'decision' | 'process' | 'dataStore' | 'note' | 'actor' | 'generic';

/** Node definition */
export interface IRNode {
  /** Unique identifier (required) */
  id: string;
  /** Display label (required) */
  label: string;
  /** Multi-line labels (optional, split by \n). Used for node size estimation. */
  labelRows?: string[];
  /** Node type (required) */
  type: NodeType;
  /** Parent group id (optional) */
  group?: string;
  /** Manual node size override (optional). Overrides auto-estimation. */
  size?: { width?: number; height?: number };
  /** Extension metadata (optional) */
  metadata?: Record<string, unknown>;
}

/** Edge type enum */
export type EdgeType =
  'association' | 'inheritance' | 'aggregation' | 'composition' | 'foreignKey' | 'flow';

/** ER diagram cardinality (Crow's Foot Notation) */
export type Cardinality = '1' | '0..1' | '*' | '1..*' | '0..*';

/** Edge definition */
export interface IREdge {
  /** Unique identifier (required) */
  id: string;
  /** Source node id (required) */
  source: string;
  /** Target node id (required) */
  target: string;
  /** Edge label (optional) */
  label?: string;
  /** Edge type (required) */
  type: EdgeType;
  /** Source cardinality (optional, only effective for ER foreignKey edges) */
  sourceCardinality?: Cardinality;
  /** Target cardinality (optional, only effective for ER foreignKey edges) */
  targetCardinality?: Cardinality;
  /** Extension metadata (optional) */
  metadata?: Record<string, unknown>;
}

/** Group type enum */
export type GroupType = 'container' | 'swimlane' | 'layer';

/** Group definition */
export interface IRGroup {
  /** Unique identifier (required) */
  id: string;
  /** Display label (required) */
  label: string;
  /** Group type (required) */
  type: GroupType;
}

/** Diagram type enum */
export type DiagramType = 'er' | 'flowchart';

/** Layout direction enum */
export type Direction = 'LR' | 'TB' | 'RL' | 'BT';

/** Top-level diagram structure */
export interface IRDiagram {
  /** Diagram type (required) */
  type: DiagramType;
  /** Layout direction (required) */
  direction: Direction;
  /** Node list (required) */
  nodes: IRNode[];
  /** Edge list (required) */
  edges: IREdge[];
  /** Group list (optional) */
  groups?: IRGroup[];
}
