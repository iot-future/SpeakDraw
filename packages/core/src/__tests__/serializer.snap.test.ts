import { describe, it, expect } from 'vitest';
import { serializeToDrawioXml } from '../serializer/drawio-xml';
import type { IRDiagram } from '@ai-diagram/shared';
import type { ELKLayoutResult } from '../layout/elk-prototype';

describe('serializeToDrawioXml', () => {
  it('should produce valid mxGraphModel XML for a 3-node ER diagram', () => {
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

    const layout: ELKLayoutResult = {
      nodes: [
        { id: 'user', x: 0, y: 0, width: 120, height: 60 },
        { id: 'order', x: 200, y: 0, width: 120, height: 60 },
        { id: 'product', x: 400, y: 0, width: 120, height: 60 },
      ],
      edges: [
        {
          id: 'e1',
          source: 'user',
          target: 'order',
          bendPoints: [],
        },
        {
          id: 'e2',
          source: 'order',
          target: 'product',
          bendPoints: [],
        },
      ],
    };

    const xml = serializeToDrawioXml(ir, layout);

    // 基本结构检查
    expect(xml).toContain('<mxfile');
    expect(xml).toContain('<diagram');
    expect(xml).toContain('<mxGraphModel');
    expect(xml).toContain('<root>');

    // 根 cell id=0 和 id=1
    expect(xml).toContain('id="0"');
    expect(xml).toContain('id="1"');

    // 3 个节点 cell
    expect(xml).toContain('id="user"');
    expect(xml).toContain('id="order"');
    expect(xml).toContain('id="product"');

    // 边 cell
    expect(xml).toContain('id="e1"');
    expect(xml).toContain('id="e2"');

    // 节点应有 vertex="1"
    const vertexCount = (xml.match(/vertex="1"/g) ?? []).length;
    expect(vertexCount).toBe(3);

    // 边应有 edge="1"
    const edgeCount = (xml.match(/edge="1"/g) ?? []).length;
    expect(edgeCount).toBe(2);

    // user 的 mxGeometry 包含坐标
    expect(xml).toContain('x="0"');
    // 快照测试（完整 XML 结构回归）
    expect(xml).toMatchSnapshot();
  });

  it('should produce valid XML for an empty diagram', () => {
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [],
      edges: [],
    };

    const layout: ELKLayoutResult = { nodes: [], edges: [] };
    const xml = serializeToDrawioXml(ir, layout);

    expect(xml).toContain('<mxfile');
    expect(xml).toContain('<root>');
    expect(xml).not.toContain('vertex="1"');
    expect(xml).not.toContain('edge="1"');
  });

  it('should include node labels in the XML', () => {
    const ir: IRDiagram = {
      type: 'er',
      direction: 'LR',
      nodes: [{ id: 'n1', label: 'Hello World', type: 'entity' }],
      edges: [],
    };

    const layout: ELKLayoutResult = {
      nodes: [{ id: 'n1', x: 0, y: 0, width: 120, height: 60 }],
      edges: [],
    };

    const xml = serializeToDrawioXml(ir, layout);
    expect(xml).toContain('Hello World');
  });

  it('should be parseable as valid XML and contain correct structure', () => {
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'LR',
      nodes: [
        { id: 'start', label: 'Start', type: 'process' },
        { id: 'decision', label: 'Is Valid?', type: 'decision' },
      ],
      edges: [{ id: 'e1', source: 'start', target: 'decision', type: 'flow', label: 'proceed' }],
    };

    const layout: ELKLayoutResult = {
      nodes: [
        { id: 'start', x: 0, y: 0, width: 120, height: 60 },
        { id: 'decision', x: 200, y: 0, width: 120, height: 60 },
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'decision',
          bendPoints: [
            { x: 120, y: 30 },
            { x: 200, y: 30 },
          ],
        },
      ],
    };

    const xml = serializeToDrawioXml(ir, layout);
    expect(xml).toMatchSnapshot();

    // 验证边标签
    expect(xml).toContain('proceed');

    // 验证 bend points 作为 points
    expect(xml).toContain('<Array as="points"');
  });
});
