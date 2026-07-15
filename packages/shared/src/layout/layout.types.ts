import type { Direction } from '../ir/types.js';

/** ELK port direction */
export type PortSide = 'NORTH' | 'SOUTH' | 'WEST' | 'EAST';

/**
 * A laid-out node (center-point coordinate system).
 * Center (x, y) + size (width, height) → bbox corners:
 * left = x - width/2, top = y - height/2, right = x + width/2, bottom = y + height/2
 */
export interface LayoutNode {
  /** Node id, matches IRNode.id */
  id: string;
  /** Center x coordinate */
  x: number;
  /** Center y coordinate */
  y: number;
  /** Node width */
  width: number;
  /** Node height */
  height: number;
}

/**
 * A laid-out edge (including port mapping info).
 * bendPoints are intermediate polyline control points (excludes start/end).
 * sourcePort/targetPort indicate ELK-chosen entry/exit port directions,
 * used to map to draw.io's exitX/exitY/entryX/entryY.
 */
export interface LayoutEdge {
  /** Edge id, matches IREdge.id */
  id: string;
  /** Source node id */
  source: string;
  /** Target node id */
  target: string;
  /** Intermediate polyline bend points (excludes start/end) */
  bendPoints: Array<{ x: number; y: number }>;
  /** ELK-chosen source port direction (undefined when no port constraints) */
  sourcePort?: PortSide;
  /** ELK-chosen target port direction (undefined when no port constraints) */
  targetPort?: PortSide;
  /** Source port index on multi-port nodes (0-based, optional) */
  sourcePortIndex?: number;
  /** Target port index (optional) */
  targetPortIndex?: number;
}

/**
 * Complete layout result.
 * Canvas size (width, height) is the minimum bounding box of all nodes + padding.
 */
export interface LayoutResult {
  /** Laid-out nodes */
  nodes: LayoutNode[];
  /** Laid-out edges */
  edges: LayoutEdge[];
  /** Total canvas width (all nodes bbox + padding) */
  width: number;
  /** Total canvas height */
  height: number;
}

/**
 * Layout configuration options.
 * All fields optional; defaults are used when not provided.
 */
export interface LayoutOptions {
  /** Layout direction, defaults to IR.direction */
  direction?: Direction;
  /** Horizontal node spacing in px, default 50 */
  spacingNodeNode?: number;
  /** Vertical node spacing in px, default 50 */
  spacingEdgeNode?: number;
  /** Edge-to-edge spacing in px, default 10 */
  spacingEdgeEdge?: number;
  /** Inter-layer spacing in px, default 60 */
  spacingBetweenLayers?: number;
  /** Canvas padding in px, default 40 */
  padding?: number;
  /** Per-node size overrides (key=nodeId) for precise control */
  nodeSizeOverrides?: Record<string, { width: number; height: number }>;
  /** Default min node size, default [120, 60] */
  defaultNodeSize?: { width: number; height: number };
  /** Font size in px for label length estimation, default 14 */
  fontSize?: number;
  /** Average character width factor, default 0.6 */
  charWidthFactor?: number;
  /** Label padding in px, default 20 */
  labelPadding?: number;
  /** Max node size limit [maxW, maxH], default [400, 200] */
  maxNodeSize?: { width: number; height: number };
}
