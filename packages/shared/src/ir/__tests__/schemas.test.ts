import { describe, it, expect } from 'vitest';
import { irNodeSchema, irEdgeSchema, irGroupSchema, irDiagramSchema } from '../schemas';
import type { IRNode, IREdge, IRGroup, IRDiagram } from '../types';

describe('irNodeSchema', () => {
  it('should parse a valid entity node', () => {
    const input: IRNode = {
      id: 'user',
      label: 'User',
      type: 'entity',
    };
    const result = irNodeSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse a valid node with optional fields', () => {
    const input: IRNode = {
      id: 'order-svc',
      label: 'Order Service',
      type: 'service',
      group: 'backend',
      metadata: { description: 'Handles orders' },
    };
    const result = irNodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.group).toBe('backend');
      expect(result.data.metadata).toEqual({ description: 'Handles orders' });
    }
  });

  it('should reject invalid node type', () => {
    const input = {
      id: 'n1',
      label: 'Test',
      type: 'invalidType',
    };
    const result = irNodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing required id', () => {
    const input = {
      label: 'Test',
      type: 'entity',
    };
    const result = irNodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing required label', () => {
    const input = {
      id: 'n1',
      type: 'entity',
    };
    const result = irNodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept all 8 valid node types', () => {
    const validTypes = [
      'entity',
      'service',
      'decision',
      'process',
      'dataStore',
      'note',
      'actor',
      'generic',
    ] as const;
    for (const type of validTypes) {
      const result = irNodeSchema.safeParse({ id: 'n', label: 'L', type });
      expect(result.success).toBe(true);
    }
  });
});

describe('irEdgeSchema', () => {
  it('should parse a valid association edge', () => {
    const input: IREdge = {
      id: 'e1',
      source: 'user',
      target: 'order',
      type: 'association',
    };
    const result = irEdgeSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse a valid edge with optional label', () => {
    const input: IREdge = {
      id: 'e1',
      source: 'user',
      target: 'order',
      type: 'foreignKey',
      label: 'places',
    };
    const result = irEdgeSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid edge type', () => {
    const input = {
      id: 'e1',
      source: 'a',
      target: 'b',
      type: 'invalid',
    };
    const result = irEdgeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject missing source', () => {
    const input = {
      id: 'e1',
      target: 'b',
      type: 'association',
    };
    const result = irEdgeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept all 6 valid edge types', () => {
    const validTypes = [
      'association',
      'inheritance',
      'aggregation',
      'composition',
      'foreignKey',
      'flow',
    ] as const;
    for (const type of validTypes) {
      const result = irEdgeSchema.safeParse({
        id: 'e',
        source: 'a',
        target: 'b',
        type,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('irGroupSchema', () => {
  it('should parse a valid container group', () => {
    const input: IRGroup = {
      id: 'g1',
      label: 'Backend Services',
      type: 'container',
    };
    const result = irGroupSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid group type', () => {
    const input = {
      id: 'g1',
      label: 'G',
      type: 'invalid',
    };
    const result = irGroupSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('irDiagramSchema', () => {
  const validNode: IRNode = { id: 'user', label: 'User', type: 'entity' };
  const validNode2: IRNode = { id: 'order', label: 'Order', type: 'entity' };
  const validEdge: IREdge = {
    id: 'e1',
    source: 'user',
    target: 'order',
    type: 'association',
  };

  it('should parse a minimal valid ER diagram', () => {
    const input: IRDiagram = {
      type: 'er',
      direction: 'LR',
      nodes: [validNode, validNode2],
      edges: [validEdge],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should parse a flowchart diagram', () => {
    const input: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [{ id: 'start', label: 'Start', type: 'process' }],
      edges: [],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('flowchart');
    }
  });

  it('should parse diagram with optional groups', () => {
    const input: IRDiagram = {
      type: 'er',
      direction: 'LR',
      nodes: [validNode],
      edges: [],
      groups: [{ id: 'g1', label: 'Core', type: 'container' }],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject edge referencing non-existent node (source)', () => {
    const input = {
      type: 'er',
      direction: 'LR',
      nodes: [validNode],
      edges: [{ id: 'e1', source: 'nonexistent', target: 'user', type: 'association' }],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject edge referencing non-existent node (target)', () => {
    const input = {
      type: 'er',
      direction: 'LR',
      nodes: [validNode],
      edges: [{ id: 'e1', source: 'user', target: 'nonexistent', type: 'association' }],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject duplicate node ids', () => {
    const input = {
      type: 'er' as const,
      direction: 'LR' as const,
      nodes: [
        { id: 'dup', label: 'A', type: 'entity' as const },
        { id: 'dup', label: 'B', type: 'entity' as const },
      ],
      edges: [],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject node with non-existent group reference', () => {
    const input = {
      type: 'er',
      direction: 'LR',
      nodes: [{ id: 'n1', label: 'N', type: 'entity', group: 'nonexistent' }],
      edges: [],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid diagram type', () => {
    const input = {
      type: 'invalid',
      direction: 'LR',
      nodes: [validNode],
      edges: [],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject invalid direction', () => {
    const input = {
      type: 'er',
      direction: 'DIAGONAL',
      nodes: [validNode],
      edges: [],
    };
    const result = irDiagramSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should accept all 4 directions', () => {
    const directions = ['LR', 'TB', 'RL', 'BT'] as const;
    for (const direction of directions) {
      const result = irDiagramSchema.safeParse({
        type: 'er',
        direction,
        nodes: [validNode],
        edges: [],
      });
      expect(result.success).toBe(true);
    }
  });
});
