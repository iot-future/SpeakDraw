/** Conflict types */
export type ConflictType = 'overlap' | 'edgeThroughNode' | 'orphan' | 'edgeCross' | 'labelOverflow';

/** Conflict severity */
export type ConflictSeverity = 'error' | 'warning';

/** A single validation conflict */
export interface ValidationConflict {
  /** Unique conflict identifier */
  id: string;
  /** Conflict type */
  type: ConflictType;
  /** Affected cell IDs */
  elements: string[];
  /** Human-readable description */
  message: string;
  /** Severity level */
  severity: ConflictSeverity;
}

/** Validation report */
export interface ValidationReport {
  /** Whether all checks passed */
  passed: boolean;
  /** Conflict list */
  conflicts: ValidationConflict[];
  /** Summary information */
  summary: string;
}

/** Validation options */
export interface ValidationOptions {
  /** AABB overlap tolerance in px, default 1 */
  tolerance?: number;
  /** Max fix rounds, default 5 */
  maxFixRounds?: number;
  /** Enable label overflow detection (P1), default false */
  enableLabelCheck?: boolean;
}

/** Axis-Aligned Bounding Box */
export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Vertex geometry extracted from XML */
export interface GeometricVertex {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  kind: 'vertex';
}

/** Line segment */
export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Edge geometry extracted from XML */
export interface GeometricEdge {
  id: string;
  source: string;
  target: string;
  segments: LineSegment[];
  kind: 'edge';
}

/** Geometric cell (vertex or edge) */
export type GeometricCell = GeometricVertex | GeometricEdge;

/** Geometry parsing result */
export interface GeometryParseResult {
  vertices: GeometricVertex[];
  edges: GeometricEdge[];
}
