// 一次性验证脚本：生成 test-output.drawio 供手动在 draw.io 打开确认。
// 允许使用 console.log 输出路径提示（非业务代码）。
import { prototypeLayout, serializeToDrawioXml } from '@ai-diagram/core';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { IRDiagram } from '@ai-diagram/shared';

async function main(): Promise<void> {
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

  const outputPath = resolve('packages/core/test-output.drawio');
  writeFileSync(outputPath, xml, 'utf-8');
  console.log('Generated:', outputPath);
  console.log('Open this file with draw.io desktop or https://app.diagrams.net/');
}

main().catch(console.error);
