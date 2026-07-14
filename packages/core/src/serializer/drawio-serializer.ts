import type { IRDiagram, LayoutResult } from '@ai-diagram/shared';
import { buildNodeStyleMap, buildEdgeStyleMap, buildGroupStyleMap } from '../styling/style-applier';
import {
  buildRootCells,
  buildNodeCell,
  buildEdgeCell,
  buildContainerCell,
  wrapMxGraphModel,
} from './mxgraph-builder';
import type {
  NodeStyleTemplate,
  EdgeStyleTemplate,
  GroupStyleTemplate,
} from '../styling/style-templates';

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
  /** 自定义容器样式覆盖 */
  groupStyleOverrides?: Partial<Record<string, Partial<GroupStyleTemplate>>>;
  /** 分组容器内边距（px），默认 20 */
  groupPadding?: number;
}

/** 画布外安全偏移量，确保空容器不渲染在负坐标区域 */
const MIN_POS = 0;
const DEFAULT_GROUP_PADDING = 20;
/** 空容器默认尺寸 */
const EMPTY_CONTAINER_SIZE = { width: 120, height: 60 };

/**
 * 将 IR + ELK 布局结果序列化为 draw.io mxGraphModel XML 字符串。
 *
 * 对齐 PRD S3-13。
 *
 * 数据流：
 * IR → buildGroupStyleMap / buildNodeStyleMap / buildEdgeStyleMap（模板 → style）
 *     → buildContainerCell（group 包围盒 → 容器 mxCell）
 *     → buildNodeCell（style + 坐标 → 节点 mxCell，parent 指向容器或图层根）
 *     → buildEdgeCell（style + 坐标 + port → 边 mxCell）
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
  const groupStyleMap = buildGroupStyleMap(ir, options.groupStyleOverrides);

  // 快速查找表
  const nodeLabelMap = new Map(ir.nodes.map((n) => [n.id, n.label]));
  const edgeLabelMap = new Map(ir.edges.filter((e) => e.label).map((e) => [e.id, e.label!]));

  // 已知的合法 group id 集合（用于过滤 orphan 引用）
  const validGroupIds = new Set((ir.groups ?? []).map((g) => g.id));

  // 节点 id → 所属 group id（仅当 group 在 ir.groups 中声明时才生效）
  const nodeGroupMap = new Map(
    ir.nodes.filter((n) => n.group && validGroupIds.has(n.group)).map((n) => [n.id, n.group!]),
  );
  // group id → label
  const groupLabelMap = new Map((ir.groups ?? []).map((g) => [g.id, g.label]));

  const cells: string[] = [];

  // 根 cell
  cells.push(...buildRootCells());

  // 分组容器 cell（S3-06）：节点之前先创建容器，子节点 parent 指向容器
  const groupPadding = options.groupPadding ?? DEFAULT_GROUP_PADDING;
  if (ir.groups && ir.groups.length > 0) {
    for (const group of ir.groups) {
      // 找到属于该 group 的所有 layout 节点
      const childNodes = layout.nodes.filter((n) => nodeGroupMap.get(n.id) === group.id);
      const groupStyle = groupStyleMap.get(group.id) ?? '';
      const groupLabel = groupLabelMap.get(group.id) ?? group.id;

      let containerX: number;
      let containerY: number;
      let containerW: number;
      let containerH: number;

      if (childNodes.length === 0) {
        // 空容器：使用默认尺寸
        containerX = MIN_POS;
        containerY = MIN_POS;
        containerW = EMPTY_CONTAINER_SIZE.width;
        containerH = EMPTY_CONTAINER_SIZE.height;
      } else {
        // 计算子节点包围盒 + padding
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        for (const cn of childNodes) {
          const left = cn.x - cn.width / 2;
          const top = cn.y - cn.height / 2;
          const right = cn.x + cn.width / 2;
          const bottom = cn.y + cn.height / 2;
          if (left < minX) minX = left;
          if (top < minY) minY = top;
          if (right > maxX) maxX = right;
          if (bottom > maxY) maxY = bottom;
        }

        containerX = Math.round(Math.max(MIN_POS, minX - groupPadding));
        containerY = Math.round(Math.max(MIN_POS, minY - groupPadding));
        containerW = Math.round(maxX - minX + groupPadding * 2);
        containerH = Math.round(maxY - minY + groupPadding * 2);
      }

      cells.push(
        ...buildContainerCell(
          group.id,
          groupLabel,
          groupStyle,
          containerX,
          containerY,
          containerW,
          containerH,
        ),
      );
    }
  }

  // 节点 cell（group 内节点的 parent 指向容器）
  for (const node of layout.nodes) {
    const style = nodeStyleMap.get(node.id) ?? '';
    const label = nodeLabelMap.get(node.id) ?? node.id;
    const topLeftX = Math.round(node.x - node.width / 2);
    const topLeftY = Math.round(node.y - node.height / 2);

    // S3-10：group 内节点 parent 指向容器，否则指向图层根（1）
    const groupId = nodeGroupMap.get(node.id);
    const parent = groupId ?? '1';

    cells.push(
      ...buildNodeCell(node.id, label, style, topLeftX, topLeftY, node.width, node.height, parent),
    );
  }

  // 边 cell（始终 parent="1"，draw.io 边不能放入容器）
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
        '1',
        edge.sourcePortIndex,
        edge.targetPortIndex,
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
