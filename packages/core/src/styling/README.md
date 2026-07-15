# Styling 模块

## 职责

负责将 SpeakDraw 中间表示（IR）中的节点/边/分组类型转换为 draw.io mxCell 的 style 属性字符串。本模块是"类型 → 视觉样式"的编译层，不涉及布局坐标计算。

## 目录结构

```
styling/
├── style-templates.ts       # 样式模板定义：节点/边/分组模板 + Crow's Foot 映射表
├── style-applier.ts         # 样式编译器：将 IR 图编译为 id→style 的 Map
├── style-templates.test.ts  # 样式模板单元测试（含基数映射测试）
├── style-applier.test.ts    # 样式编译器单元测试（含 Crow's Foot 分支）
├── index.ts                 # barrel export
└── README.md                # 本文件
```

| 文件                 | 角色                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `style-templates.ts` | 定义所有样式模板常量（`NODE_STYLE_TEMPLATES`、`EDGE_STYLE_TEMPLATES`、`GROUP_STYLE_TEMPLATES`）+ ER 图 Crow's Foot 基数到 draw.io marker 的映射表 |
| `style-applier.ts`   | `buildEdgeStyleMap(ir)` — 遍历 IR edges，根据类型和 cardinality 编译为最终 style 字符串；`buildNodeStyleMap` / `buildGroupStyleMap` 同理          |

## 对外接口

### 模板常量（style-templates.ts）

| 导出                    | 类型                                     | 说明                                        |
| ----------------------- | ---------------------------------------- | ------------------------------------------- |
| `NODE_STYLE_TEMPLATES`  | `Record<NodeType, NodeStyleTemplate>`    | 8 种节点类型 → 样式模板                     |
| `EDGE_STYLE_TEMPLATES`  | `Record<EdgeType, EdgeStyleTemplate>`    | 6 种边类型 → 样式模板                       |
| `GROUP_STYLE_TEMPLATES` | `Record<GroupType, GroupStyleTemplate>`  | 3 种分组类型 → 样式模板                     |
| `DEFAULT_NODE_STYLE`    | `NodeStyleTemplate`                      | 回退节点样式（generic）                     |
| `DEFAULT_EDGE_STYLE`    | `EdgeStyleTemplate`                      | 回退边样式（association）                   |
| `CARDINALITY_TO_MARKER` | `Record<Cardinality, CardinalityMarker>` | ER 图基数 → draw.io Crow's Foot marker 映射 |
| `ER_EDGE_STYLE`         | `'entityRelationEdgeStyle'`              | ER 图专用边路由风格常量                     |
| `CardinalityMarker`     | 联合类型                                 | draw.io ER marker 名称类型                  |

### 编译器（style-applier.ts）

| 导出                 | 签名                                                      | 说明                                        |
| -------------------- | --------------------------------------------------------- | ------------------------------------------- |
| `buildEdgeStyleMap`  | `(ir: IRDiagram, customTemplates?) → Map<string, string>` | 将 IR edges 编译为 `edgeId → style字符串`   |
| `buildNodeStyleMap`  | `(ir: IRDiagram, customTemplates?) → Map<string, string>` | 将 IR nodes 编译为 `nodeId → style字符串`   |
| `buildGroupStyleMap` | `(ir: IRDiagram, customTemplates?) → Map<string, string>` | 将 IR groups 编译为 `groupId → style字符串` |
| `applyEdgeStyle`     | `(type: EdgeType, overrides?) → string`                   | 单条边样式编译（模板 + 覆盖）               |
| `applyNodeStyle`     | `(type: NodeType, overrides?) → string`                   | 单节点样式编译                              |
| `compileEdgeStyle`   | `(template, overrides?) → string`                         | 纯函数：模板对象 → style 字符串             |
| `compileNodeStyle`   | `(template, overrides?) → string`                         | 纯函数：模板对象 → style 字符串             |
| `compileGroupStyle`  | `(template, overrides?) → string`                         | 纯函数：模板对象 → style 字符串             |

### Crow's Foot 基数映射（v0.2.2 新增）

```
Cardinality → CardinalityMarker → draw.io 视觉表现
   1       →  ERone           →  竖线
   0..1    →  ERzeroToOne     →  圆圈 + 竖线
   *       →  ERmany          →  三叉爪印
   1..*    →  ERoneToMany     →  竖线 + 爪印
   0..*    →  ERzeroToMany    →  圆圈 + 爪印
```

**触发条件**：仅当 `edge.type === 'foreignKey'` 且 `edge.sourceCardinality` 或 `edge.targetCardinality` 存在时，`buildEdgeStyleMap` 自动切换为 `entityRelationEdgeStyle` + ER marker，否则保持 `orthogonalEdgeStyle` 默认样式。

**关键设计**：

- `sourceCardinality` → `startArrow`（线起点）、`targetCardinality` → `endArrow`（线终点）
- ER 边使用 `startFill=0`、`endFill=0`（Crow's Foot marker 不填充）
- ER 边使用实线（`dashed=0`），区别于无基数 foreignKey 边的虚线（`dashed=1`）

## 依赖关系

| 依赖                            | 用途                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| `@speakdraw/shared`             | 类型定义（`NodeType`、`EdgeType`、`GroupType`、`Cardinality`、`IRDiagram`）              |
| `packages/core/src/serializer/` | **被依赖** — serializer 调用 `buildEdgeStyleMap` / `buildNodeStyleMap` 获取 style 字符串 |

本模块不依赖任何后端/前端框架，是纯函数式编译层。

## 数据流 / 调用链

```
IRDiagram（含 edges[n].sourceCardinality / targetCardinality）
  │
  ▼
buildEdgeStyleMap(ir)
  │  遍历 ir.edges：
  │  ├─ edge.type === 'foreignKey' && hasCardinality
  │  │   → overrides = { edgeStyle: entityRelationEdgeStyle,
  │  │       startArrow: CARDINALITY_TO_MARKER[sourceCardinality],
  │  │       endArrow: CARDINALITY_TO_MARKER[targetCardinality],
  │  │       startFill: 0, endFill: 0, dashed: 0, ... }
  │  │   → applyEdgeStyle('foreignKey', overrides)
  │  │
  │  └─ else → applyEdgeStyle(edge.type, customTemplates?.[edge.id])
  │
  ▼
Map<edgeId, styleString>
  │
  ▼
drawio-serializer.ts → mxgraph-builder.ts
  │  entityRelationEdgeStyle 边 → 跳过 bendPoints
  ▼
draw.io mxCell XML
```

## 配置项

无运行时配置。所有样式均为编译时常量。如需自定义样式颜色/形状，通过 `buildEdgeStyleMap` 的 `customTemplates` 参数传入覆盖。

## 常见问题 / 陷阱

- **Q: 为什么 Crow's Foot 边不显示 bendPoints？** A: `entityRelationEdgeStyle` 是 draw.io 内置的 ER 连接器样式，它根据 source/target 节点位置自动计算曲线路由，不需要也不支持 bendPoints。序列化器在检测到 `entityRelationEdgeStyle` 时会自动跳过 bendPoints 生成。
- **Q: 在非 foreignKey 边上设置 cardinality 会怎样？** A: 被忽略，边保持原有样式。cardinality 仅在 `type: 'foreignKey'` 时生效。
- **Q: 如何新增一种基数类型？** A: 1) 在 `shared/src/ir/types.ts` 扩展 `Cardinality` 联合类型；2) 在 `shared/src/ir/schemas.ts` 更新 Zod enum；3) 在 `style-templates.ts` 的 `CARDINALITY_TO_MARKER` 中添加映射条目并扩展 `CardinalityMarker` 类型；4) 更新测试。
