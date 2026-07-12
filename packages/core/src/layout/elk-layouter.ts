import ELK from 'elkjs/lib/elk.bundled';
import type {
  IRDiagram,
  LayoutResult,
  LayoutNode,
  LayoutEdge,
  PortSide,
  LayoutOptions,
} from '@ai-diagram/shared';
import { irDiagramSchema } from '@ai-diagram/shared';
import { convertIRToELK } from './ir-to-elk';

const elk = new ELK();

/** 画布边距默认值 */
const DEFAULT_PADDING = 40;

/**
 * 从 ELK 边结果中提取端口方向。
 * ELK 的 port 信息在 edge.sections[].incomingShape / outgoingShape 中，
 * 通过解析 port id 后缀（_NORTH/_SOUTH/_WEST/_EAST）获取方向。
 *
 * @param portId - ELK 输出的 port id，如 "n1_NORTH"
 * @returns PortSide 或 undefined
 */
function extractPortSide(portId: string | undefined): PortSide | undefined {
  if (!portId) return undefined;
  const suffix = portId.split('_').pop();
  if (suffix === 'NORTH' || suffix === 'SOUTH' || suffix === 'WEST' || suffix === 'EAST') {
    return suffix;
  }
  return undefined;
}

/**
 * 对 IRDiagram 执行 ELK `layered` 布局，返回带中心点坐标与端口信息的 LayoutResult。
 *
 * 全过程：
 * 1. zod 校验 IR
 * 2. IR → ELK Graph（通过 convertIRToELK，含 ports、尺寸、正交路由）
 * 3. 调用 elk.layout() 执行布局
 * 4. 结果转换为 LayoutResult：
 *    - 节点坐标从 ELK 左上角转为中心点
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

  // 提取节点：ELK 输出左上角坐标 → 中心点坐标系
  const nodes: LayoutNode[] = (elkLayout.children ?? []).map((child) => {
    const w = child.width ?? 120;
    const h = child.height ?? 60;
    const x = (child.x ?? 0) + w / 2;
    const y = (child.y ?? 0) + h / 2;
    return { id: child.id, x, y, width: w, height: h };
  });

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
