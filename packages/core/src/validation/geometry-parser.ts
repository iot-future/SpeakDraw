// packages/core/src/validation/geometry-parser.ts
import { XMLParser } from 'fast-xml-parser';
import type {
  GeometricVertex,
  GeometricEdge,
  GeometryParseResult,
  LineSegment,
} from '@speakdraw/shared';

/**
 * XML 中 mxCell 元素的原始类型。
 * fast-xml-parser 解析后的中间结构。
 */
interface ParsedMxCell {
  '@_id': string;
  '@_vertex'?: string;
  '@_edge'?: string;
  '@_parent'?: string;
  '@_value'?: string;
  '@_source'?: string;
  '@_target'?: string;
  mxGeometry?: {
    '@_x'?: string;
    '@_y'?: string;
    '@_width'?: string;
    '@_height'?: string;
    '@_relative'?: string;
    '@_as'?: string;
    Array?: {
      '@_as'?: string;
      mxPoint?:
        | Array<{
            '@_x': string;
            '@_y': string;
            '@_as'?: string;
          }>
        | {
            '@_x': string;
            '@_y': string;
            '@_as'?: string;
          };
    };
    mxPoint?: {
      '@_x': string;
      '@_y': string;
      '@_as'?: string;
    };
  };
}

interface ParsedXml {
  mxfile?: {
    diagram?: {
      mxGraphModel?: {
        root?: {
          mxCell?: ParsedMxCell[];
        };
      };
    };
  };
}

/** fast-xml-parser 配置：保留属性前缀 @_，不 trim 文本，不解析数字/布尔 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string): boolean => name === 'mxCell' || name === 'mxPoint',
});

/**
 * 判断 mxCell 是否应跳过（根 cell id=0 或 id=1）
 */
function isRootCell(id: string): boolean {
  return id === '0' || id === '1';
}

/**
 * 从 mxPoint 中提取线段端点。
 * 单个 mxPoint（作为 sourcePoint/targetPoint）时无 @_as 标记，需由调用方区分。
 */
function parsePoint(point: { '@_x': string; '@_y': string }): { x: number; y: number } {
  return { x: Number(point['@_x']), y: Number(point['@_y']) };
}

/**
 * 提取边（edge cell）的几何线段。
 *
 * 从 mxCell 的 mxGeometry 中提取 sourcePoint → bendPoints(Array/mxPoint) → targetPoint，
 * 构建连续线段列表。
 *
 * @param cell - 已解析的 mxCell 对象
 * @returns 线段数组，若无几何信息则返回空数组
 */
function extractEdgeSegments(cell: ParsedMxCell): LineSegment[] {
  const geo = cell.mxGeometry;
  if (!geo) return [];

  const points: Array<{ x: number; y: number }> = [];

  // 提取 sourcePoint - geo.mxPoint 可能是单个对象或数组
  if (geo.mxPoint) {
    const mpList = Array.isArray(geo.mxPoint) ? geo.mxPoint : [geo.mxPoint];
    for (const mp of mpList) {
      if (mp['@_as'] === 'sourcePoint') {
        points.push(parsePoint(mp));
      }
    }
  }

  // 提取 bendPoints（Array/as="points" 下的 mxPoint 列表）
  if (geo.Array && geo.Array['@_as'] === 'points' && geo.Array.mxPoint) {
    const bendPts = Array.isArray(geo.Array.mxPoint) ? geo.Array.mxPoint : [geo.Array.mxPoint];
    for (const bp of bendPts) {
      points.push(parsePoint(bp));
    }
  }

  // 提取 targetPoint
  if (geo.mxPoint) {
    const mpList = Array.isArray(geo.mxPoint) ? geo.mxPoint : [geo.mxPoint];
    for (const mp of mpList) {
      if (mp['@_as'] === 'targetPoint') {
        points.push(parsePoint(mp));
      }
    }
  }

  // 构建线段
  const segments: LineSegment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({
      x1: points[i]!.x,
      y1: points[i]!.y,
      x2: points[i + 1]!.x,
      y2: points[i + 1]!.y,
    });
  }

  return segments;
}

/**
 * 从 draw.io mxGraphModel XML 中提取顶点和边的几何信息。
 *
 * 解析 XML 中的所有 vertex cell（提取 id / bbox / label）和 edge cell
 * （提取 id / source / target / 线段列表），跳过根 cell（id=0/1）。
 *
 * @param xml - 完整的 draw.io mxGraphModel XML 字符串
 * @returns 几何解析结果（顶点列表 + 边列表）
 */
export function parseGeometry(xml: string): GeometryParseResult {
  const parsed: ParsedXml = parser.parse(xml);

  const vertices: GeometricVertex[] = [];
  const edges: GeometricEdge[] = [];

  // 导航到 mxCell 数组：mxfile → diagram → mxGraphModel → root → mxCell[]
  const diagram = parsed.mxfile?.diagram;
  if (!diagram) return { vertices, edges };

  // diagram 可能是数组（多页），取第一个
  const d = Array.isArray(diagram) ? diagram[0] : diagram;
  if (!d) return { vertices, edges };

  const model = d.mxGraphModel;
  if (!model) return { vertices, edges };

  const root = model.root;
  if (!root) return { vertices, edges };

  const cells = root.mxCell;
  if (!cells) return { vertices, edges };

  for (const cell of cells) {
    const id = cell['@_id'];
    if (!id || isRootCell(id)) continue;

    if (cell['@_vertex'] === '1') {
      const geo = cell.mxGeometry;
      vertices.push({
        id,
        x: geo?.['@_x'] !== undefined ? Number(geo['@_x']) : 0,
        y: geo?.['@_y'] !== undefined ? Number(geo['@_y']) : 0,
        width: geo?.['@_width'] !== undefined ? Number(geo['@_width']) : 0,
        height: geo?.['@_height'] !== undefined ? Number(geo['@_height']) : 0,
        label: cell['@_value'] ?? id,
        kind: 'vertex',
      });
    } else if (cell['@_edge'] === '1') {
      edges.push({
        id,
        source: cell['@_source'] ?? '',
        target: cell['@_target'] ?? '',
        segments: extractEdgeSegments(cell),
        kind: 'edge',
      });
    }
  }

  return { vertices, edges };
}
