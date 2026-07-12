import type { ElkNode, ElkExtendedEdge, ElkPort } from 'elkjs/lib/elk.bundled';
import type { IRDiagram, IRNode, IREdge, LayoutOptions, PortSide } from '@ai-diagram/shared';

/** 默认布局参数 */
const DEFAULTS = {
  defaultNodeSize: { width: 120, height: 60 },
  spacingNodeNode: 50,
  spacingEdgeNode: 30,
  spacingEdgeEdge: 10,
  spacingBetweenLayers: 60,
  fontSize: 14,
  charWidthFactor: 0.6,
  labelPadding: 20,
  maxNodeSize: { width: 400, height: 200 },
  padding: 40,
} as const;

/** 4 个端口方向常量 */
const PORT_SIDES: PortSide[] = ['NORTH', 'SOUTH', 'WEST', 'EAST'];

/**
 * 方向映射：IR LayoutOption/IRDiagram.direction → ELK direction string
 */
const DIRECTION_MAP: Record<string, string> = {
  LR: 'RIGHT',
  TB: 'DOWN',
  RL: 'LEFT',
  BT: 'UP',
};

/**
 * 根据标签长度 + 字体参数估算节点尺寸。
 * 公式：width = label.length × fontSize × charWidthFactor + labelPadding
 *       height = fontSize + labelPadding
 * 结果受 min（defaultNodeSize）和 max（maxNodeSize）约束。
 *
 * @param label - 节点显示标签
 * @param options - 布局选项
 * @returns 估算的节点宽高（整数像素）
 */
export function estimateNodeSize(
  label: string,
  options?: LayoutOptions,
): { width: number; height: number } {
  const fontSize = options?.fontSize ?? DEFAULTS.fontSize;
  const charWidthFactor = options?.charWidthFactor ?? DEFAULTS.charWidthFactor;
  const labelPadding = options?.labelPadding ?? DEFAULTS.labelPadding;
  const defaultSize = options?.defaultNodeSize ?? DEFAULTS.defaultNodeSize;
  const maxSize = options?.maxNodeSize ?? DEFAULTS.maxNodeSize;

  const estimatedWidth = label.length * fontSize * charWidthFactor + labelPadding;
  const estimatedHeight = fontSize + labelPadding;

  return {
    width: Math.max(defaultSize.width, Math.min(maxSize.width, Math.ceil(estimatedWidth))),
    height: Math.max(defaultSize.height, Math.min(maxSize.height, Math.ceil(estimatedHeight))),
  };
}

/**
 * 为 ELK 节点创建四边端口定义。
 * 每个端口有唯一 id（nodeId_SIDE），固定大小 5px，分布在各边中点。
 *
 * @param nodeId - 节点 id
 * @returns 4 个端口组成的数组（NORTH, SOUTH, WEST, EAST）
 */
function createPorts(nodeId: string): ElkPort[] {
  return PORT_SIDES.map((side) => ({
    id: `${nodeId}_${side}`,
    width: 5,
    height: 5,
    properties: {
      'port.side': side,
    },
  }));
}

/**
 * 判断边是否为自环（source === target）。
 */
function isSelfLoop(edge: IREdge): boolean {
  return edge.source === edge.target;
}

/**
 * 将 IRDiagram 转换为 ELK 内部图结构（不执行布局）。
 *
 * 关键转换：
 * - 节点 → ELK child（含四边 ports、估算尺寸、override 支持）
 * - 边 → ELK edge（含 source/target 节点引用，正交路由由 layoutOptions 控制）
 * - 自环边：ELK layered 不完全支持，传入时添加标识属性
 * - 多边聚合：同 source→target 的多条边各自独立定义（ELK 自动分离路由）
 * - 布局方向、间距等配置选项 → ELK layoutOptions
 *
 * @param ir - 经过 zod 校验的 IRDiagram
 * @param options - 布局配置选项（可选）
 * @returns ELK 图根节点（children + edges + layoutOptions）
 */
export function convertIRToELK(ir: IRDiagram, options?: LayoutOptions): ElkNode {
  const children: ElkNode[] = ir.nodes.map((node: IRNode) => {
    const size = options?.nodeSizeOverrides?.[node.id] ?? estimateNodeSize(node.label, options);

    return {
      id: node.id,
      width: size.width,
      height: size.height,
      ports: createPorts(node.id),
    };
  });

  const edges: ElkExtendedEdge[] = ir.edges.map((edge: IREdge) => {
    const base: ElkExtendedEdge = {
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    };

    // 自环边：ELK 不完全支持，传入时添加标识
    if (isSelfLoop(edge)) {
      return {
        ...base,
        properties: { 'elk.selfLoop': 'true' },
      };
    }

    return base;
  });

  const direction = options?.direction ?? ir.direction;

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': DIRECTION_MAP[direction] ?? 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': String(options?.spacingNodeNode ?? DEFAULTS.spacingNodeNode),
      'elk.spacing.edgeNode': String(options?.spacingEdgeNode ?? DEFAULTS.spacingEdgeNode),
      'elk.spacing.edgeEdge': String(options?.spacingEdgeEdge ?? DEFAULTS.spacingEdgeEdge),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(
        options?.spacingBetweenLayers ?? DEFAULTS.spacingBetweenLayers,
      ),
    },
    children,
    edges,
  };
}
