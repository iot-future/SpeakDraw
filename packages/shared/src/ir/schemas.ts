import { z } from 'zod';

// --- 枚举 ---

export const nodeTypeEnum = z.enum([
  'entity',
  'service',
  'decision',
  'process',
  'dataStore',
  'note',
  'actor',
  'generic',
]);

export const edgeTypeEnum = z.enum([
  'association',
  'inheritance',
  'aggregation',
  'composition',
  'foreignKey',
  'flow',
]);

/** ER 图关系基数校验（Crow's Foot Notation） */
export const cardinalitySchema = z.enum(['1', '0..1', '*', '1..*', '0..*']).optional();

export const groupTypeEnum = z.enum(['container', 'swimlane', 'layer']);

export const diagramTypeEnum = z.enum(['er', 'flowchart']);

export const directionEnum = z.enum(['LR', 'TB', 'RL', 'BT']);

// --- 基本 Schema ---

export const irNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  labelRows: z.array(z.string()).optional(),
  type: nodeTypeEnum,
  group: z.string().optional(),
  size: z
    .object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const irEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  type: edgeTypeEnum,
  sourceCardinality: cardinalitySchema,
  targetCardinality: cardinalitySchema,
  metadata: z.record(z.unknown()).optional(),
});

export const irGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: groupTypeEnum,
});

// --- IRDiagram 带跨字段校验 ---

export const irDiagramSchema = z
  .object({
    type: diagramTypeEnum,
    direction: directionEnum,
    nodes: z.array(irNodeSchema),
    edges: z.array(irEdgeSchema),
    groups: z.array(irGroupSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const nodeIds = new Set(data.nodes.map((n) => n.id));
    const groupIds = new Set(data.groups?.map((g) => g.id) ?? []);

    // 校验节点 id 不重复（Zod 默认不做，显式检查）
    if (data.nodes.length !== nodeIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '节点 id 存在重复',
        path: ['nodes'],
      });
    }

    // 校验边的 source/target 引用存在的节点
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i]!;
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `边 "${edge.id}" 的 source "${edge.source}" 引用了不存在的节点`,
          path: ['edges', i, 'source'],
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `边 "${edge.id}" 的 target "${edge.target}" 引用了不存在的节点`,
          path: ['edges', i, 'target'],
        });
      }
    }

    // 校验节点的 group 引用存在的分组
    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i]!;
      if (node.group && !groupIds.has(node.group)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `节点 "${node.id}" 的 group "${node.group}" 引用了不存在的分组`,
          path: ['nodes', i, 'group'],
        });
      }
    }

    // 校验分组 id 不重复
    if (data.groups && data.groups.length !== groupIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '分组 id 存在重复',
        path: ['groups'],
      });
    }
  });
