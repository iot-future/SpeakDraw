import ELK from 'elkjs/lib/elk.bundled';
import type {
  IRDiagram,
  LayoutResult,
  LayoutNode,
  LayoutEdge,
  PortSide,
  LayoutOptions,
} from '@ai-diagram/shared';
import type { ElkNode } from 'elkjs/lib/elk.bundled';
import { irDiagramSchema } from '@ai-diagram/shared';
import { convertIRToELK } from './ir-to-elk';

const elk = new ELK();

/** 画布边距默认值 */
const DEFAULT_PADDING = 40;

/**
 * 从 ELK port id 中提取端口方向。
 * 兼容旧格式 "n1_NORTH" 和新格式 "n1_NORTH_0"（多端口）。
 *
 * @param portId - ELK 输出的 port id
 * @returns PortSide 或 undefined
 */
function extractPortSide(portId: string | undefined): PortSide | undefined {
  if (!portId) return undefined;
  // 格式: "nodeId_SIDE" 或 "nodeId_SIDE_index"
  const parts = portId.split('_');
  if (parts.length < 2) return undefined;
  // 最后一个部分如果是数字，取倒数第二部分为 side
  const lastPart = parts[parts.length - 1]!;
  const isIndex = /^\d+$/.test(lastPart);
  const suffix = isIndex ? parts[parts.length - 2] : lastPart;
  if (suffix === 'NORTH' || suffix === 'SOUTH' || suffix === 'WEST' || suffix === 'EAST') {
    return suffix;
  }
  return undefined;
}

/** 从 ELK port id 中提取端口索引 */
function extractPortIndex(portId: string | undefined): number | undefined {
  if (!portId) return undefined;
  const parts = portId.split('_');
  const lastPart = parts[parts.length - 1]!;
  const isIndex = /^\d+$/.test(lastPart);
  return isIndex ? parseInt(lastPart, 10) : undefined;
}

/**
 * 递归收集 ELK 树中所有节点（含容器节点和叶子节点）。
 *
 * 处理 hierarchyHandling 产生的嵌套结构：容器节点可能有 children，
 * 叶子节点位于深层嵌套中。本函数将所有节点展平到单一列表。
 *
 * @param node - ELK 节点（可能含 children）
 * @returns 布局节点列表
 */
function collectNodes(node: ElkNode): LayoutNode[] {
  const result: LayoutNode[] = [];
  const w = node.width ?? 120;
  const h = node.height ?? 60;
  const x = (node.x ?? 0) + w / 2;
  const y = (node.y ?? 0) + h / 2;
  result.push({ id: node.id, x, y, width: w, height: h });
  if (node.children) {
    for (const child of node.children) {
      result.push(...collectNodes(child));
    }
  }
  return result;
}

/**
 * 对 IRDiagram 执行 ELK `layered` 布局，返回带中心点坐标与端口信息的 LayoutResult。
 *
 * 全过程：
 * 1. zod 校验 IR
 * 2. IR → ELK Graph（通过 convertIRToELK，含 ports、尺寸、正交路由）
 * 3. 调用 elk.layout() 执行布局
 * 4. 结果转换为 LayoutResult：
 *    - 节点坐标从 ELK 左上角转为中心点（含嵌套容器节点）
 *    - 边提取 bendPoints + sourcePort/targetPort
 *    - 计算画布总尺寸（所有节点 bbox 最小包围矩形 + padding）
 *
 * @param ir - 已校验的中间表示图
 * @param options - 布局配置选项
 * @returns 含所有坐标与端口信息的布局结果
 */
export async function layoutDiagram(ir: IRDiagram, options?: LayoutOptions): Promise<LayoutResult> {
  // 入口校验：非法 IR 在此 fail-fast，避免污染下游布局结果
  irDiagramSchema.parse(ir);

  const elkGraph = convertIRToELK(ir, options);
  const elkLayout = await elk.layout(elkGraph);

  // 提取节点：递归遍历嵌套 ELK 树（支持 hierarchyHandling 产生的容器节点）
  const nodes: LayoutNode[] = [];
  if (elkLayout.children) {
    for (const child of elkLayout.children) {
      nodes.push(...collectNodes(child));
    }
  }

  // 提取边：bendPoints + 端口方向
  const edges: LayoutEdge[] = (elkLayout.edges ?? []).map((edge) => {
    const sections = edge.sections ?? [];
    const bendPoints: Array<{ x: number; y: number }> = [];

    // 第一段的 outgoingShape 为 sourcePort
    const firstSection = sections[0];
    const sourcePort = extractPortSide(firstSection?.outgoingShape);

    // 最后段的 incomingShape 为 targetPort
    const lastSection = sections[sections.length - 1];
    const targetPort = extractPortSide(lastSection?.incomingShape);

    // 提取所有中间折线点
    for (const section of sections) {
      for (const bp of section.bendPoints ?? []) {
        bendPoints.push({ x: bp.x, y: bp.y });
      }
    }

    return {
      id: edge.id,
      source: edge.sources[0] ?? '',
      target: edge.targets[0] ?? '',
      bendPoints,
      sourcePort,
      targetPort,
      sourcePortIndex: extractPortIndex(firstSection?.outgoingShape),
      targetPortIndex: extractPortIndex(lastSection?.incomingShape),
    };
  });

  // 计算画布总尺寸（所有节点 bbox 最小包围矩形 + padding）
  const padding = options?.padding ?? DEFAULT_PADDING;
  const canvasWidth =
    nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.x + n.width / 2)) + padding;
  const canvasHeight =
    nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.y + n.height / 2)) + padding;

  return { nodes, edges, width: canvasWidth, height: canvasHeight };
}
