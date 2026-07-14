# 布局引擎 (Layout Engine)

## 职责

将 IR（中间表示图）通过 ELK 布局算法转换为带坐标的 `LayoutResult`，供序列化器渲染为 draw.io XML。

## 目录结构

| 文件              | 角色                                                      |
| ----------------- | --------------------------------------------------------- |
| `ir-to-elk.ts`    | IR → ELK 图结构转换（节点尺寸估算、端口创建、容器嵌套）   |
| `elk-layouter.ts` | 执行 ELK 布局 + 结果提取（节点坐标、边路由、端口信息）    |
| `port-mapping.ts` | ELK 端口方向 → draw.io exitX/exitY/entryX/entryY 坐标映射 |

## 对外接口

- `convertIRToELK(ir, options?) → ElkNode` — 将 IR 转为 ELK 图结构（含嵌套容器，当 `ir.groups` 存在时启用 `hierarchyHandling: 'INCLUDE_CHILDREN'`）
- `estimateNodeSize(label, labelRows?, options?) → {width, height}` — 估算节点尺寸（支持多行标签 + CJK 字符宽度）
- `layoutDiagram(ir, options?) → Promise<LayoutResult>` — 完整布局流程入口
- `mapPortToDrawio(port, isSource, portIndex?, totalPorts?) → DrawioPortCoords` — 端口坐标映射（支持多端口均匀分布偏移）
- `estimateCharWidth(ch, fontSize, charWidthFactor) → number` — 单字符渲染宽度
- `estimateTextWidth(text, fontSize, charWidthFactor) → number` — 字符串渲染宽度
- `isCJKChar(ch) → boolean` — CJK 字符判定

## 当前实现

- **布局算法**：ELK `layered`（分层布局）
- **边路由**：`ORTHOGONAL`（正交路由）
- **容器支持**：ELK `hierarchyHandling: 'INCLUDE_CHILDREN'`（v0.2.1）
- **端口**：≤4 边节点 → 4 端口（每边 1 个），>4 边节点 → 每边最多 3 端口（v0.2.1）
- **尺寸估算**：基于 CJK 字符宽度（2× 英文字符）+ 行数 × 行高（LINE_HEIGHT=20px）（v0.2.1）

## 依赖关系

- **依赖**：`@ai-diagram/shared`（IR 类型、Zod Schema、LayoutOptions/LayoutResult 类型）
- **被依赖**：`serializer/`（序列化器消费 LayoutResult）
- **被依赖**：`cli/`、`mcp-server/`、`web/`（通过 core 入口）

## 数据流

```
IRDiagram → convertIRToELK() → ElkNode → elk.layout() → ELK 布局结果
  → collectNodes() 递归提取（含容器节点）→ LayoutResult → serializer
```

## 配置项

| 配置                    | 默认值                              | 说明                         |
| ----------------------- | ----------------------------------- | ---------------------------- |
| `spacingNodeNode`       | 50（扁平时）/ 80（容器根层）        | 节点间距（组内 40，组间 80） |
| `spacingEdgeNode`       | 30                                  | 边-节点间距                  |
| `spacingBetweenLayers`  | 60                                  | 层间距                       |
| `fontSize`              | 14                                  | 字号                         |
| `charWidthFactor`       | 0.6                                 | 字符宽度系数                 |
| `labelPadding`          | 20                                  | 标签内边距                   |
| `defaultNodeSize`       | 120×60                              | 最小节点尺寸                 |
| `maxNodeSize`           | 400×500（v0.2.1 改为 500 高度上限） | 最大节点尺寸                 |
| `padding`               | 40                                  | 画布边距                     |
| `LINE_HEIGHT`           | 20                                  | 行高（v0.2.1 新增常量）      |
| `CJK_CHAR_WIDTH_FACTOR` | 2                                   | CJK 字符宽度倍数（v0.2.1）   |
| `MAX_PORTS_PER_SIDE`    | 3                                   | 每边最大端口数（v0.2.1）     |

## 常见问题

- **Q: 容器内节点为何排列更紧凑？** A: 组内 `spacing.nodeNode=40`，组间 `spacing.nodeNode=80`（≥ 2×），这是 PRD v0.2.1 的设计要求（AC-05）。
- **Q: 为什么 ELK 结果中有容器节点？** A: v0.2.1 使用 `hierarchyHandling: 'INCLUDE_CHILDREN'` 让 ELK 原生处理容器布局，`collectNodes()` 递归提取所有节点（含容器）。序列化器中会过滤掉容器 id（不渲染为普通节点）。
- **Q: 多端口后 ELK 边路由质量下降怎么办？** A: 每边最多 3 端口（`MAX_PORTS_PER_SIDE`），超过 12 条边的极端情况接受降级。
- **Q: CJK 字符宽度估算准确吗？** A: 按 2× 英文字符保守估算，留足 padding 避免溢出。极端字体下可能有偏差，但满足 AC-02 不截断要求。
