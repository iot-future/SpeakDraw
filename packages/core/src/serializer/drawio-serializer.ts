import type { IRDiagram, LayoutResult } from '@ai-diagram/shared';
import { buildNodeStyleMap, buildEdgeStyleMap } from '../styling/style-applier';
import { buildRootCells, buildNodeCell, buildEdgeCell, wrapMxGraphModel } from './mxgraph-builder';
import type { NodeStyleTemplate, EdgeStyleTemplate } from '../styling/style-templates';

/**
 * 序列化选项。
 */
export interface SerializeOptions {
  /** mxfile 的 modified 时间戳来源，默认当前时间；测试注入固定值以稳定快照 */
  now?: Date;
  /** diagram id，默认 "diagram-1" */
  diagramId?: string;
  /** diagram name，默认 "Page-1" */
  diagramName?: string;
  /** 是否压缩为单行输出（.drawio 标准格式），默认 false（pretty 多行） */
  compact?: boolean;
  /** 自定义节点样式覆盖 */
  nodeStyleOverrides?: Partial<Record<string, Partial<NodeStyleTemplate>>>;
  /** 自定义边样式覆盖 */
  edgeStyleOverrides?: Partial<Record<string, Partial<EdgeStyleTemplate>>>;
}

/**
 * 将 IR + ELK 布局结果序列化为 draw.io mxGraphModel XML 字符串。
 *
 * 对齐 PRD S3-13。
 *
 * 数据流：
 * IR → buildNodeStyleMap / buildEdgeStyleMap（模板 → style 字符串）
 *     → buildNodeCell / buildEdgeCell（style + 坐标 → mxCell XML）
 *     → wrapMxGraphModel（所有 cell → 完整 XML）
 *
 * @param ir - 中间表示图（已校验）
 * @param layout - ELK 布局结果
 * @param options - 序列化选项
 * @returns 完整 draw.io XML 字符串
 */
export function serialize(
  ir: IRDiagram,
  layout: LayoutResult,
  options: SerializeOptions = {},
): string {
  const nodeStyleMap = buildNodeStyleMap(ir, options.nodeStyleOverrides);
  const edgeStyleMap = buildEdgeStyleMap(ir, options.edgeStyleOverrides);

  // 快速查找表
  const nodeLabelMap = new Map(ir.nodes.map((n) => [n.id, n.label]));
  const edgeLabelMap = new Map(ir.edges.filter((e) => e.label).map((e) => [e.id, e.label!]));

  const cells: string[] = [];

  // 根 cell
  cells.push(...buildRootCells());

  // 节点 cell
  for (const node of layout.nodes) {
    const style = nodeStyleMap.get(node.id) ?? '';
    const label = nodeLabelMap.get(node.id) ?? node.id;
    // 中心点坐标 → draw.io 左上角坐标
    const topLeftX = Math.round(node.x - node.width / 2);
    const topLeftY = Math.round(node.y - node.height / 2);

    cells.push(
      ...buildNodeCell(node.id, label, style, topLeftX, topLeftY, node.width, node.height),
    );
  }

  // 边 cell
  for (const edge of layout.edges) {
    const style = edgeStyleMap.get(edge.id) ?? '';
    const label = edgeLabelMap.get(edge.id);

    cells.push(
      ...buildEdgeCell(
        edge.id,
        label,
        style,
        edge.source,
        edge.target,
        edge.bendPoints,
        edge.sourcePort,
        edge.targetPort,
      ),
    );
  }

  return wrapMxGraphModel(cells, {
    now: options.now,
    diagramId: options.diagramId,
    diagramName: options.diagramName,
    compact: options.compact,
  });
}
