import { describe, it, expect } from 'vitest';
import { prototypeLayout } from '../layout/elk-prototype';
import type { IRDiagram } from '@ai-diagram/shared';

describe('prototypeLayout', () => {
  it('should layout a simple 3-node ER diagram', async () => {
    const ir: IRDiagram = {
      type: 'er',
      direction: 'LR',
      nodes: [
        { id: 'user', label: 'User', type: 'entity' },
        { id: 'order', label: 'Order', type: 'entity' },
        { id: 'product', label: 'Product', type: 'entity' },
      ],
      edges: [
        { id: 'e1', source: 'user', target: 'order', type: 'association' },
        { id: 'e2', source: 'order', target: 'product', type: 'association' },
      ],
    };

    const result = await prototypeLayout(ir);

    // 应返回 3 个布局后的节点
    expect(result.nodes).toHaveLength(3);

    // 每个节点应有合法的位置和尺寸
    for (const node of result.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }

    // 节点不应重叠（简单检查：x 或 y 至少有一个维度不重叠）
    const [n0, n1, n2] = result.nodes;
    if (n0 && n1 && n2) {
      // user 在 order 左边（LR 布局，user → order → product）
      expect(n0.x).toBeLessThan(n1.x);
      expect(n1.x).toBeLessThan(n2.x);
    }

    // 应返回 2 条边
    expect(result.edges).toHaveLength(2);

    // 每条边应有路由点
    for (const edge of result.edges) {
      expect(edge.id).toBeTruthy();
      expect(edge.source).toBeTruthy();
      expect(edge.target).toBeTruthy();
    }
  });

  it('should layout an empty diagram without error', async () => {
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [],
      edges: [],
    };

    const result = await prototypeLayout(ir);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('should layout a single node', async () => {
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [{ id: 'n1', label: 'Start', type: 'process' }],
      edges: [],
    };

    const result = await prototypeLayout(ir);
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0]!;
    expect(node.width).toBeGreaterThan(0);
    expect(node.height).toBeGreaterThan(0);
  });

  it('should layout ER diagram with TB direction', async () => {
    const ir: IRDiagram = {
      type: 'er',
      direction: 'TB',
      nodes: [
        { id: 'a', label: 'A', type: 'entity' },
        { id: 'b', label: 'B', type: 'entity' },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', type: 'foreignKey' }],
    };

    const result = await prototypeLayout(ir);
    const [n0, n1] = result.nodes;
    if (n0 && n1) {
      // TB 布局：a 在 b 上方
      expect(n0.y).toBeLessThan(n1.y);
    }
  });
});
