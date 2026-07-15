import type { ElkNode, ElkExtendedEdge, ElkPort } from 'elkjs/lib/elk.bundled';
import type { IRDiagram, IRNode, IREdge, LayoutOptions, PortSide } from '@speakdraw/shared';

/** 默认布局参数（仅含本模块消费的字段，padding 由 elk-layouter.ts 单独管理） */
const DEFAULTS = {
  defaultNodeSize: { width: 120, height: 60 },
  spacingNodeNode: 50,
  spacingEdgeNode: 30,
  spacingEdgeEdge: 10,
  spacingBetweenLayers: 60,
  fontSize: 14,
  charWidthFactor: 0.6,
  labelPadding: 20,
  maxNodeSize: { width: 400, height: 500 },
} as const;

/** 行高（px） */
const LINE_HEIGHT = 20;

/** 中文字符宽度系数（相对于英文字符） */
const CJK_CHAR_WIDTH_FACTOR = 2;

/** 4 个端口方向常量 */
const PORT_SIDES: PortSide[] = ['NORTH', 'SOUTH', 'WEST', 'EAST'];

/** 每边最大端口数限制 */
const MAX_PORTS_PER_SIDE = 3;

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
 * 判断字符是否为 CJK（中日韩）字符或全角符号。
 * 覆盖范围：CJK 统一表意文字、CJK 扩展 A、CJK 符号和标点、半角和全角形式。
 *
 * @param ch - 单个字符
 * @returns 是否为 CJK/全角字符
 */
export function isCJKChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
    (code >= 0x3000 && code <= 0x303f) || // CJK Symbols and Punctuation
    (code >= 0xff00 && code <= 0xffef) // Halfwidth and Fullwidth Forms
  );
}

/**
 * 估算单个字符渲染宽度（px）。
 * 中文字符按 CJK_CHAR_WIDTH_FACTOR（2）× 英文字符宽度计算。
 *
 * @param ch - 单个字符
 * @param fontSize - 字号（px）
 * @param charWidthFactor - 英文字符宽度系数
 * @returns 估算的字符宽度（px）
 */
export function estimateCharWidth(ch: string, fontSize: number, charWidthFactor: number): number {
  if (isCJKChar(ch)) {
    return fontSize * charWidthFactor * CJK_CHAR_WIDTH_FACTOR;
  }
  return fontSize * charWidthFactor;
}

/**
 * 估算字符串渲染宽度（px），逐字符累加。
 * CJK 字符按 2× 英文字符宽度计算，其余字符按 fontSize × charWidthFactor 计算。
 *
 * @param text - 待估算的字符串
 * @param fontSize - 字号（px）
 * @param charWidthFactor - 英文字符宽度系数
 * @returns 估算的字符串宽度（px）
 */
export function estimateTextWidth(text: string, fontSize: number, charWidthFactor: number): number {
  let width = 0;
  for (const ch of text) {
    width += estimateCharWidth(ch, fontSize, charWidthFactor);
  }
  return width;
}

/**
 * 根据标签内容估算节点尺寸。
 *
 * 新算法：
 * - height = max(行数, 1) × LINE_HEIGHT + labelPadding
 * - width = max(所有行估算宽度的最大值) + labelPadding
 * - 结果受 min（defaultNodeSize）和 max（maxNodeSize）约束
 *
 * @param label - 节点显示标签（单行或多行 \\n 分隔）
 * @param labelRows - 多行标签数组（可选，优先使用）
 * @param options - 布局选项（可选）
 * @returns 估算的节点宽高（整数像素）
 */
export function estimateNodeSize(
  label: string,
  labelRows?: string[] | LayoutOptions,
  options?: LayoutOptions,
): { width: number; height: number } {
  // Backward compatibility: estimateNodeSize(label, options?)
  let actualRows: string[] | undefined;
  let actualOptions: LayoutOptions | undefined;

  if (Array.isArray(labelRows)) {
    // Called as estimateNodeSize(label, labelRows, options?)
    actualRows = labelRows;
    actualOptions = options;
  } else {
    // Called as estimateNodeSize(label, options?)
    actualRows = undefined;
    actualOptions = labelRows;
  }

  const fontSize = actualOptions?.fontSize ?? DEFAULTS.fontSize;
  const charWidthFactor = actualOptions?.charWidthFactor ?? DEFAULTS.charWidthFactor;
  const labelPadding = actualOptions?.labelPadding ?? DEFAULTS.labelPadding;
  const defaultSize = actualOptions?.defaultNodeSize ?? DEFAULTS.defaultNodeSize;
  const maxSize = actualOptions?.maxNodeSize ?? DEFAULTS.maxNodeSize;

  // 行数计算：优先 labelRows，否则按 \n 拆分
  const rows: string[] = actualRows ?? label.split('\n');
  const rowCount = Math.max(rows.length, 1);

  // 找出最宽行：基于逐字符宽度估算
  let longestWidth = estimateTextWidth(rows[0] ?? '', fontSize, charWidthFactor);
  for (let i = 1; i < rows.length; i++) {
    const w = estimateTextWidth(rows[i]!, fontSize, charWidthFactor);
    if (w > longestWidth) {
      longestWidth = w;
    }
  }

  const estimatedWidth = longestWidth + labelPadding;
  const estimatedHeight = rowCount * LINE_HEIGHT + labelPadding;

  return {
    width: Math.max(defaultSize.width, Math.min(maxSize.width, Math.ceil(estimatedWidth))),
    height: Math.max(defaultSize.height, Math.min(maxSize.height, Math.ceil(estimatedHeight))),
  };
}

/**
 * 为 ELK 节点创建端口定义。
 *
 * 端口数决策：
 * - edgeCount ≤ 4 → 每边 1 端口（保持简洁，AC-08）
 * - edgeCount > 4 → 每边 M = clamp(ceil(edgeCount/4), 1, 3) 个端口（AC-07）
 *
 * 端口 id 格式："{nodeId}_{SIDE}_{index}"（index 从 0 开始）
 *
 * @param nodeId - 节点 id
 * @param edgeCount - 与该节点相连的边总数（入边+出边）
 * @returns 端口数组
 */
function createPorts(nodeId: string, edgeCount?: number): ElkPort[] {
  const total = edgeCount ?? 0;
  const portsPerSide = total <= 4 ? 1 : Math.min(Math.ceil(total / 4), MAX_PORTS_PER_SIDE);

  const ports: ElkPort[] = [];
  for (const side of PORT_SIDES) {
    for (let i = 0; i < portsPerSide; i++) {
      ports.push({
        id: `${nodeId}_${side}_${i}`,
        width: 5,
        height: 5,
      });
    }
  }
  return ports;
}

/**
 * 判断边是否为自环（source === target）。
 */
function isSelfLoop(edge: IREdge): boolean {
  return edge.source === edge.target;
}

/**
 * 构建单个 ELK 节点（含尺寸估算与端口创建）。
 *
 * @param node - IR 节点
 * @param edgeCount - 与该节点相连的边总数
 * @param options - 布局配置选项
 * @returns ELK 子节点
 */
function buildElkNode(node: IRNode, edgeCount: number, options?: LayoutOptions): ElkNode {
  // 手动尺寸覆盖优先于自动估算 (AC-03)
  let size: { width: number; height: number };
  if (node.size) {
    const estimated = estimateNodeSize(node.label, node.labelRows, options);
    size = {
      width: node.size.width ?? estimated.width,
      height: node.size.height ?? estimated.height,
    };
  } else if (options?.nodeSizeOverrides?.[node.id]) {
    size = options.nodeSizeOverrides[node.id]!;
  } else {
    size = estimateNodeSize(node.label, node.labelRows, options);
  }

  return {
    id: node.id,
    width: size.width,
    height: size.height,
    ports: createPorts(node.id, edgeCount),
  };
}

/**
 * 构建 ELK 边列表（从 IR 边转换）。
 *
 * @param edges - IR 边列表
 * @returns ELK 边数组
 */
function buildElkEdges(edges: IREdge[]): ElkExtendedEdge[] {
  return edges.map((edge: IREdge) => {
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
 * - 分组（groups）：当 ir.groups 存在且非空时，构建嵌套结构（hierarchyHandling: INCLUDE_CHILDREN）
 *
 * @param ir - 经过 zod 校验的 IRDiagram
 * @param options - 布局配置选项（可选）
 * @returns ELK 图根节点（children + edges + layoutOptions）
 */
export function convertIRToELK(ir: IRDiagram, options?: LayoutOptions): ElkNode {
  // 统计每个节点的边数
  const nodeEdgeCount = new Map<string, number>();
  for (const edge of ir.edges) {
    nodeEdgeCount.set(edge.source, (nodeEdgeCount.get(edge.source) ?? 0) + 1);
    nodeEdgeCount.set(edge.target, (nodeEdgeCount.get(edge.target) ?? 0) + 1);
  }

  const direction = options?.direction ?? ir.direction;
  const edges = buildElkEdges(ir.edges);

  const groups = ir.groups;
  const hasGroups = groups && groups.length > 0;

  if (!hasGroups) {
    // === 扁平结构（无分组，AC-10 向后兼容） ===
    const children: ElkNode[] = ir.nodes.map((node: IRNode) =>
      buildElkNode(node, nodeEdgeCount.get(node.id) ?? 0, options),
    );

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

  // === 嵌套结构（有分组，hierarchyHandling: INCLUDE_CHILDREN） ===

  // 建立 nodeId → groupId 的快速查找
  const nodeGroupMap = new Map<string, string>();
  for (const node of ir.nodes) {
    if (node.group) {
      nodeGroupMap.set(node.id, node.group);
    }
  }

  // 建立 groupId → IRGroup 的映射
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  // 收集每个 group 的成员节点
  const groupMembers = new Map<string, IRNode[]>();
  const ungroupedNodes: IRNode[] = [];

  for (const node of ir.nodes) {
    const groupId = nodeGroupMap.get(node.id);
    if (groupId && groupMap.has(groupId)) {
      const members = groupMembers.get(groupId);
      if (members) {
        members.push(node);
      } else {
        groupMembers.set(groupId, [node]);
      }
    } else {
      ungroupedNodes.push(node);
    }
  }

  // 构建 group 容器节点
  const groupContainers: ElkNode[] = [];
  for (const group of groups) {
    const members = groupMembers.get(group.id) ?? [];
    const containerChildren: ElkNode[] = members.map((node) =>
      buildElkNode(node, nodeEdgeCount.get(node.id) ?? 0, options),
    );

    groupContainers.push({
      id: group.id,
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': DIRECTION_MAP[direction] ?? 'DOWN',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.spacing.nodeNode': '40',
        'elk.padding': '[top=30,left=20,bottom=20,right=20]',
      },
      children: containerChildren,
    });
  }

  // 构建未分组节点（扁平）
  const ungroupedElkNodes: ElkNode[] = ungroupedNodes.map((node) =>
    buildElkNode(node, nodeEdgeCount.get(node.id) ?? 0, options),
  );

  return {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': DIRECTION_MAP[direction] ?? 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.spacing.nodeNode': '80',
      'elk.spacing.edgeNode': String(options?.spacingEdgeNode ?? DEFAULTS.spacingEdgeNode),
      'elk.spacing.edgeEdge': String(options?.spacingEdgeEdge ?? DEFAULTS.spacingEdgeEdge),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(
        options?.spacingBetweenLayers ?? DEFAULTS.spacingBetweenLayers,
      ),
      'elk.spacing.componentComponent': '80',
    },
    children: [...groupContainers, ...ungroupedElkNodes],
    edges,
  };
}
