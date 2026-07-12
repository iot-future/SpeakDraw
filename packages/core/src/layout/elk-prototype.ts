import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled';
import type { IRDiagram, IRNode, IREdge } from '@ai-diagram/shared';
import { irDiagramSchema } from '@ai-diagram/shared';

/** ELK 布局后的节点位置与尺寸 */
export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** ELK 布局后的边路由 */
export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  /** 路由控制点列表（用于折线/正交线，不含起点终点） */
  bendPoints: Array<{ x: number; y: number }>;
}

/** 完整的 ELK 布局结果 */
export interface ELKLayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

const elk = new ELK();

/** 节点默认宽高 */
const DEFAULT_WIDTH = 120;
const DEFAULT_HEIGHT = 60;

/**
 * ELK 布局原型（最小验证用）。
 * 正式版 `layout()` 将在 Step 2 实现更完整的 ports/尺寸推断逻辑。
 */
export async function prototypeLayout(ir: IRDiagram): Promise<ELKLayoutResult> {
  // 入口即校验：非法 IR（如边引用了不存在的节点）在此 fail-fast，避免污染下游布局结果。
  irDiagramSchema.parse(ir);

  const layoutDirection = ir.direction === 'TB' || ir.direction === 'BT' ? 'DOWN' : 'RIGHT';

  // 将 IR 节点转换为 ELK 节点
  // 注意（已知缺口，待 Step 2+）：ir.groups 在 Step 0 不参与布局，
  // 既未传给 ELK 作为父容器，序列化器也不渲染分组容器 cell。
  // 节点上的 group 引用仅经过 schema 校验，不会体现在最终几何结果中。
  const children: ElkNode[] = ir.nodes.map((node: IRNode) => ({
    id: node.id,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  }));

  // 将 IR 边转换为 ELK 边（不使用 ports，走最简单的 center 连接）
  const edges: ElkExtendedEdge[] = ir.edges.map((edge: IREdge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': layoutDirection,
      'elk.spacing.nodeNode': '50',
      'elk.spacing.edgeNode': '30',
      'elk.spacing.edgeEdge': '10',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    },
    children,
    edges,
  };

  const layoutResult = await elk.layout(graph);

  // 提取布局后的节点位置
  const resultNodes: LayoutNode[] = (layoutResult.children ?? []).map((child) => ({
    id: child.id,
    x: child.x ?? 0,
    y: child.y ?? 0,
    width: child.width ?? DEFAULT_WIDTH,
    height: child.height ?? DEFAULT_HEIGHT,
  }));

  // 提取边路由控制点
  const resultEdges: LayoutEdge[] = (layoutResult.edges ?? []).map((edge) => {
    const sections = edge.sections ?? [];
    const bendPoints: Array<{ x: number; y: number }> = [];
    for (const section of sections) {
      const bp = section.bendPoints ?? [];
      // draw.io 的 <Array as="points"> 只接受中间折线点，
      // 起点/终点由 source/target 锚点自动决定，不能塞进 points，否则连线会绕回起点。
      for (const p of bp) {
        bendPoints.push({ x: p.x, y: p.y });
      }
    }
    return {
      id: edge.id,
      source: edge.sources[0] ?? '',
      target: edge.targets[0] ?? '',
      bendPoints,
    };
  });

  return { nodes: resultNodes, edges: resultEdges };
}
