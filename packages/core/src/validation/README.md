# 静态几何校验模块（Validation）

## 职责

对生成的 draw.io XML 做**零成本静态几何分析**，检测节点重叠、连线穿框、孤立节点、边交叉等冲突。作为质量兜底层，不信任任何上游环节。

## 目录结构

```
validation/
├── ports/
│   └── validation.ts              # ValidationPort 接口（支持多种校验策略）
├── adapters/
│   └── static-validator-impl.ts   # StaticValidatorImpl（P0 静态校验实现）
├── detectors/
│   ├── math-utils.ts              # 数学工具（aabbOverlap / linesIntersect / segmentIntersectsBBox）
│   ├── overlap-detector.ts        # 节点重叠检测（AABB）
│   ├── orphan-detector.ts         # 孤立节点检测（warning）
│   ├── edge-through-node-detector.ts  # 连线穿框检测
│   ├── edge-cross-detector.ts     # 边交叉检测（正交免报）
│   └── label-overflow-detector.ts # 标签溢出检测（P1）
├── geometry-parser.ts             # XML → GeometricCell 解析器
├── smart-fix.ts                   # 自动修复引擎（P1，fix-validate 循环 ≤5 轮）
└── index.ts                       # barrel export
```

## 对外接口（Ports）

| 接口             | 位置                  | 签名                                                                   |
| ---------------- | --------------------- | ---------------------------------------------------------------------- |
| `ValidationPort` | `ports/validation.ts` | `validate(xml: string, options?: ValidationOptions): ValidationReport` |
| `parseGeometry`  | `geometry-parser.ts`  | `parseGeometry(xml: string): GeometryParseResult`                      |
| `smartFix`       | `smart-fix.ts`        | `smartFix(xml, validator, options?): SmartFixResult`                   |

## 当前实现

| Port             | Adapter               | 说明                                                                      |
| ---------------- | --------------------- | ------------------------------------------------------------------------- |
| `ValidationPort` | `StaticValidatorImpl` | 解析 XML → 运行 4 个 P0 检测器 + 1 个 P1 检测器 → 生成 `ValidationReport` |

### 新增校验策略步骤

1. 在 `adapters/` 创建 `<Name>ValidatorImpl`，实现 `ValidationPort` 接口
2. 在 DI/注册表中选择注入（当前无 DI 容器，直接 `new`）

## 依赖关系

- **依赖**：`@speakdraw/shared`（ValidationConflict / ValidationReport / GeometricCell 等类型）、`fast-xml-parser`（XML 解析）
- **被依赖**：Step 5 CLI / Step 6 MCP Server（调用 `validate()` 做质量兜底）

## 数据流 / 调用链

```
draw.io XML
    │
    ▼
parseGeometry()           ← 解析 mxGraphModel XML → {vertices[], edges[]}
    │
    ├── detectOverlaps()      ← AABB 两两比较
    ├── detectOrphans()       ← 孤立节点检测（warning）
    ├── detectEdgeThroughNode() ← 线段-矩形相交检测
    └── detectEdgeCrosses()   ← 线段相交检测（正交免报）
    │
    ▼
StaticValidatorImpl.validate()
    │
    ▼
ValidationReport { passed, conflicts[], summary }
    │
    ▼ (可选 P1)
smartFix()  ← fix-validate 循环，最多 5 轮
```

## 配置项

无外部配置项。校验选项通过 `ValidationOptions` 运行时传入：

| 选项               | 默认值  | 说明                       |
| ------------------ | ------- | -------------------------- |
| `tolerance`        | `1`     | AABB 重叠容忍误差（px）    |
| `maxFixRounds`     | `5`     | 修复最大轮数               |
| `enableLabelCheck` | `false` | 是否启用标签溢出检测（P1） |

## 已知限制

- **S4-11 边重路由未实现**：smart_fix 仅支持 overlap 位移修复，edge-through-node 重路由需要重新跑 ELK 布局，在 XML 层面无法做到
- **正则替换 XML 坐标**：smart_fix 用正则替换节点坐标，在复杂嵌套 XML 场景下可能不够鲁棒。当前场景（系统自生成的 XML）可控
- **仅处理单页 diagram**：`parseGeometry()` 取第一页，多页暂不支持（Phase 2）

## 性能

- 纯计算，无 IO
- 100 节点图校验耗时 < 100ms（保守估计）
- 复杂度：O(n²) 顶点两两比较（检测器）、O(m²×s) 边交叉检测（含线段级）
