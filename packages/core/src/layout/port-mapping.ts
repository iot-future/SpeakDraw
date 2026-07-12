import type { PortSide } from '@ai-diagram/shared';

/**
 * draw.io 的 exit（源端口）或 entry（目标端口）坐标。
 * 值为 0/0.5/1，表示节点该边上的相对位置。
 */
export interface DrawioPortCoords {
  exitX?: number;
  exitY?: number;
  entryX?: number;
  entryY?: number;
}

/**
 * ELK port side → draw.io exitX/exitY/entryX/entryY 完整映射矩阵。
 *
 * 映射规则（PRD §3.2 S2-08）：
 * - NORTH: 节点上边中点 → (0.5, 0)
 * - SOUTH: 节点下边中点 → (0.5, 1)
 * - WEST:  节点左边中点 → (0, 0.5)
 * - EAST:  节点右边中点 → (1, 0.5)
 *
 * @param port - ELK 输出的端口方向
 * @param isSource - true 表示该端口是边的出口（映射到 exitX/exitY），
 *                   false 表示该端口是边的入口（映射到 entryX/entryY）
 * @returns draw.io 兼容的端口坐标
 */
export function mapPortToDrawio(port: PortSide, isSource: boolean): DrawioPortCoords {
  // Record<PortSide, T> 覆盖全部 4 个值，TypeScript 保证 coords[port] 一定存在，
  // 无需运行时守卫，也不抛裸 Error。
  const coords: Record<PortSide, { x: number; y: number }> = {
    NORTH: { x: 0.5, y: 0 },
    SOUTH: { x: 0.5, y: 1 },
    WEST: { x: 0, y: 0.5 },
    EAST: { x: 1, y: 0.5 },
  };

  const { x, y } = coords[port];

  return isSource ? { exitX: x, exitY: y } : { entryX: x, entryY: y };
}

/**
 * ELK port side 到 draw.io 坐标的静态映射表。
 * 第一维：port side，第二维：[source 坐标, target 坐标]
 */
export const PORT_SIDE_MATRIX: Record<
  PortSide,
  { source: { exitX: number; exitY: number }; target: { entryX: number; entryY: number } }
> = {
  NORTH: { source: { exitX: 0.5, exitY: 0 }, target: { entryX: 0.5, entryY: 0 } },
  SOUTH: { source: { exitX: 0.5, exitY: 1 }, target: { entryX: 0.5, entryY: 1 } },
  WEST: { source: { exitX: 0, exitY: 0.5 }, target: { entryX: 0, entryY: 0.5 } },
  EAST: { source: { exitX: 1, exitY: 0.5 }, target: { entryX: 1, entryY: 0.5 } },
};
