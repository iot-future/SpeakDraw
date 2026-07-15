import { z } from 'zod';

// --- Enums ---

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

/** ER diagram cardinality validation (Crow's Foot Notation) */
export const cardinalitySchema = z.enum(['1', '0..1', '*', '1..*', '0..*']).optional();

export const groupTypeEnum = z.enum(['container', 'swimlane', 'layer']);

export const diagramTypeEnum = z.enum(['er', 'flowchart']);

export const directionEnum = z.enum(['LR', 'TB', 'RL', 'BT']);

// --- Base Schemas ---

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

// --- IRDiagram with cross-field validation ---

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

    // Validate no duplicate node ids (Zod does not do this by default)
    if (data.nodes.length !== nodeIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate node ids detected',
        path: ['nodes'],
      });
    }

    // Validate edge source/target reference existing nodes
    for (let i = 0; i < data.edges.length; i++) {
      const edge = data.edges[i]!;
      if (!nodeIds.has(edge.source)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge "${edge.id}" source "${edge.source}" references non-existent node`,
          path: ['edges', i, 'source'],
        });
      }
      if (!nodeIds.has(edge.target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Edge "${edge.id}" target "${edge.target}" references non-existent node`,
          path: ['edges', i, 'target'],
        });
      }
    }

    // Validate node group references exist
    for (let i = 0; i < data.nodes.length; i++) {
      const node = data.nodes[i]!;
      if (node.group && !groupIds.has(node.group)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Node "${node.id}" group "${node.group}" references non-existent group`,
          path: ['nodes', i, 'group'],
        });
      }
    }

    // Validate no duplicate group ids
    if (data.groups && data.groups.length !== groupIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate group ids detected',
        path: ['groups'],
      });
    }
  });
