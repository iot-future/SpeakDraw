/** 冲突类型 */
export type ConflictType = 'overlap' | 'edgeThroughNode' | 'orphan' | 'edgeCross' | 'labelOverflow';

/** 冲突严重程度 */
export type ConflictSeverity = 'error' | 'warning';

/** 单个校验冲突 */
export interface ValidationConflict {
  /** 冲突唯一标识 */
  id: string;
  /** 冲突类型 */
  type: ConflictType;
  /** 涉及的 cell ID 列表 */
  elements: string[];
  /** 人类可读描述 */
  message: string;
  /** 严重程度 */
  severity: ConflictSeverity;
}

/** 校验报告 */
export interface ValidationReport {
  /** 是否通过所有校验 */
  passed: boolean;
  /** 冲突列表 */
  conflicts: ValidationConflict[];
  /** 摘要信息 */
  summary: string;
}

/** 校验选项 */
export interface ValidationOptions {
  /** AABB 容忍误差（px），默认 1 */
  tolerance?: number;
  /** 最大修复轮数，默认 5 */
  maxFixRounds?: number;
  /** 是否启用标签溢出检测（P1），默认 false */
  enableLabelCheck?: boolean;
}

/** 包围盒（Axis-Aligned Bounding Box） */
export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 从 XML 提取的顶点几何信息 */
export interface GeometricVertex {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  kind: 'vertex';
}

/** 线段 */
export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 从 XML 提取的边几何信息 */
export interface GeometricEdge {
  id: string;
  source: string;
  target: string;
  segments: LineSegment[];
  kind: 'edge';
}

/** 几何单元（顶点或边） */
export type GeometricCell = GeometricVertex | GeometricEdge;

/** 几何解析结果 */
export interface GeometryParseResult {
  vertices: GeometricVertex[];
  edges: GeometricEdge[];
}
