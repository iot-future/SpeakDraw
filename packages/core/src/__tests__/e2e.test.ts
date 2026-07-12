import { describe, it, expect } from 'vitest';
import { prototypeLayout, serializeToDrawioXml } from '../index';
import type { IRDiagram } from '@ai-diagram/shared';

describe('End-to-End: IR → ELK → draw.io XML', () => {
  it('should produce a valid draw.io XML from a 3-node 2-edge ER diagram', async () => {
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

    const layout = await prototypeLayout(ir);
    const xml = serializeToDrawioXml(ir, layout);

    // 必需的结构元素
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<mxfile');
    expect(xml).toContain('<mxGraphModel');
    expect(xml).toContain('</mxGraphModel>');
    expect(xml).toContain('</mxfile>');

    // 所有节点和边都出现
    expect(xml).toContain('id="user"');
    expect(xml).toContain('id="order"');
    expect(xml).toContain('id="product"');
    expect(xml).toContain('id="e1"');
    expect(xml).toContain('id="e2"');

    // 节点不重叠（在同一个 y 上，x 递增）
    const userNode = layout.nodes.find((n) => n.id === 'user');
    const orderNode = layout.nodes.find((n) => n.id === 'order');
    const productNode = layout.nodes.find((n) => n.id === 'product');
    expect(userNode).toBeDefined();
    expect(orderNode).toBeDefined();
    expect(productNode).toBeDefined();

    if (userNode && orderNode && productNode) {
      // LR 布局：节点应从左到右排列
      expect(userNode.x).toBeLessThan(orderNode.x);
      expect(orderNode.x).toBeLessThan(productNode.x);
    }

    // 快照回归
    expect(xml).toMatchSnapshot('e2e-er-3-node');
  });

  it('should produce valid output for a flowchart', async () => {
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [
        { id: 'start', label: 'Start', type: 'process' },
        { id: 'check', label: 'Is Valid?', type: 'decision' },
        { id: 'end', label: 'End', type: 'process' },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'check', type: 'flow', label: 'next' },
        { id: 'e2', source: 'check', target: 'end', type: 'flow', label: 'yes' },
      ],
    };

    const layout = await prototypeLayout(ir);
    const xml = serializeToDrawioXml(ir, layout);

    // TB 布局：节点应从上到下排列
    const startNode = layout.nodes.find((n) => n.id === 'start');
    const checkNode = layout.nodes.find((n) => n.id === 'check');
    const endNode = layout.nodes.find((n) => n.id === 'end');

    expect(startNode).toBeDefined();
    expect(checkNode).toBeDefined();
    expect(endNode).toBeDefined();

    if (startNode && checkNode && endNode) {
      expect(startNode.y).toBeLessThan(checkNode.y);
      expect(checkNode.y).toBeLessThan(endNode.y);
    }

    expect(xml).toMatchSnapshot('e2e-flowchart-3-node');
  });
});
