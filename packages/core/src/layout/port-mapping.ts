import type { PortSide } from '@ai-diagram/shared';

/**
 * draw.io 的 exit（源端口）或 entry（目标端口）坐标。
 * 值为 0/0.5/1 或浮点数（多端口偏移时），表示节点该边上的相对位置。
 */
export interface DrawioPortCoords {
  exitX?: number;
  exitY?: number;
  entryX?: number;
  entryY?: number;
}

/**
 * ELK port side + 可选偏移索引 → draw.io exitX/exitY/entryX/entryY 映射。
 *
 * 单端口（无 index）：返回边中点 (0.5, 0)/(0.5, 1)/(0, 0.5)/(1, 0.5)
 * 多端口（有 index）：偏移 = (index + 1) / (totalPorts + 1)
 *
 * @param port - ELK 输出的端口方向
 * @param isSource - true 表示该端口是边的出口
 * @param portIndex - 端口在边上的索引（0-based，可选）
 * @param totalPorts - 该边上的总端口数（可选）
 * @returns draw.io 兼容的端口坐标
 */
export function mapPortToDrawio(
  port: PortSide,
  isSource: boolean,
  portIndex?: number,
  totalPorts?: number,
): DrawioPortCoords {
  const hasOffset = portIndex !== undefined && totalPorts !== undefined && totalPorts > 0;
  const offset = hasOffset ? (portIndex + 1) / (totalPorts + 1) : 0.5;

  // 多端口模式：沿边方向分布端口（NORTH/SOUTH 沿 x 轴，WEST/EAST 沿 y 轴）
  // 单端口模式：端口在各边中点
  const coords: Record<PortSide, { x: number; y: number }> = hasOffset
    ? {
        NORTH: { x: offset, y: 0 },
        SOUTH: { x: offset, y: 1 },
        WEST: { x: 0, y: offset },
        EAST: { x: 1, y: offset },
      }
    : {
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
