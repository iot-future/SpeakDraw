import type { ToolHandler } from '../mcp-types.js';
import { startSessionHandler } from './start-session.js';
import { generateDiagramHandler } from './generate-diagram.js';
import { getDiagramHandler } from './get-diagram.js';
import { listPagesHandler } from './list-pages.js';
import { editDiagramHandler } from './edit-diagram.js';
import { validateDiagramHandler } from './validate-diagram.js';
import { smartFixHandler } from './smart-fix.js';
import { exportDiagramHandler } from './export-diagram.js';
import { addPageHandler, renamePageHandler, deletePageHandler } from './page-tools.js';
import { autoLayoutHandler } from './auto-layout.js';
import { findCellsHandler } from './find-cells.js';
import { applyThemeHandler } from './apply-theme.js';

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const toolDefinitions: ToolDefinition[] = [
  // === P0 核心工具 ===
  {
    name: 'start_session',
    description:
      '启动一个新的图表会话，打开浏览器实时预览。返回 sessionId 和 previewUrl。在开始画图之前必须先调用此工具。',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '会话标题（可选）' },
      },
    },
  },
  {
    name: 'generate_diagram',
    description:
      '生成图表：接受 IRDiagram（推荐）或自然语言描述，执行 ELK 自动布局并序列化为 draw.io XML。' +
      ' 推荐用法：先用你（LLM）将用户需求转为 IR JSON，调用 generate_diagram({ ir: {...} })。' +
      ' 这样不需要服务端 LLM Key。' +
      ' IR 格式：{ type: "flowchart"|"er", direction: "LR"|"TB"|"RL"|"BT",' +
      ' nodes: [{ id:string, label:string, type:"entity"|"service"|"decision"|"process"|"dataStore"|"note"|"actor"|"generic", group?:string }],' +
      ' edges: [{ id:string, source:string, target:string, label?:string, type:"association"|"inheritance"|"aggregation"|"composition"|"foreignKey"|"flow" }],' +
      ' groups?: [{ id:string, label:string, type:"container"|"swimlane"|"layer" }] }。' +
      ' 示例（流程图）：{ type:"flowchart", direction:"LR", nodes:[{id:"start",label:"开始",type:"process"},{id:"end",label:"结束",type:"process"}], edges:[{id:"e1",source:"start",target:"end",label:"",type:"flow"}] }。' +
      ' 自动创建 session、校验几何冲突。',
    inputSchema: {
      type: 'object',
      properties: {
        ir: {
          type: 'object',
          description: 'IRDiagram 对象（推荐）。由调用方 LLM 直接构造，零 Key 依赖。',
          properties: {
            type: { type: 'string', enum: ['flowchart', 'er'], description: '图类型' },
            direction: { type: 'string', enum: ['LR', 'TB', 'RL', 'BT'], description: '布局方向' },
            nodes: {
              type: 'array',
              description: '节点列表',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: '唯一标识' },
                  label: { type: 'string', description: '显示文本' },
                  type: {
                    type: 'string',
                    enum: [
                      'entity',
                      'service',
                      'decision',
                      'process',
                      'dataStore',
                      'note',
                      'actor',
                      'generic',
                    ],
                    description: '节点类型',
                  },
                  group: { type: 'string', description: '所属分组id（可选）' },
                },
                required: ['id', 'label', 'type'],
              },
            },
            edges: {
              type: 'array',
              description: '边列表',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: '唯一标识' },
                  source: { type: 'string', description: '源节点id' },
                  target: { type: 'string', description: '目标节点id' },
                  label: { type: 'string', description: '边标签（可选）' },
                  type: {
                    type: 'string',
                    enum: [
                      'association',
                      'inheritance',
                      'aggregation',
                      'composition',
                      'foreignKey',
                      'flow',
                    ],
                    description: '边类型',
                  },
                },
                required: ['id', 'source', 'target', 'type'],
              },
            },
            groups: {
              type: 'array',
              description: '分组列表（可选）',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: '唯一标识' },
                  label: { type: 'string', description: '显示文本' },
                  type: {
                    type: 'string',
                    enum: ['container', 'swimlane', 'layer'],
                    description: '分组类型',
                  },
                },
                required: ['id', 'label', 'type'],
              },
            },
          },
          required: ['type', 'direction', 'nodes', 'edges'],
        },
        description: {
          type: 'string',
          description: '自然语言描述（传统模式，需服务端配置 OPENAI_API_KEY）。',
        },
        sessionId: { type: 'string', description: '会话ID（可选，不提供则自动创建新会话）' },
      },
    },
  },
  {
    name: 'get_diagram',
    description:
      '获取当前会话的完整XML及所有cell的id、类型、标签、结构。在修改图表前应先调用此工具获取当前状态。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'list_pages',
    description: '列出图表中的所有页面及基本信息（索引、名称、节点数、是否有内容）。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'edit_diagram',
    description:
      '唯一修改入口：通过原子操作数组（add/update/delete）增删改图表。一次调用可组合多种操作。add需提供完整cell数据；update/delete需提供cellId（从get_diagram获取）。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        operations: {
          type: 'array',
          description: '原子操作数组',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['add', 'update', 'delete'] },
              cellId: { type: 'string', description: 'update/delete时必填' },
              type: { type: 'string', enum: ['vertex', 'edge'] },
              data: {
                type: 'object',
                description: 'cell数据（id, label, type, parent, source, target, style）',
              },
            },
            required: ['action', 'data'],
          },
        },
      },
      required: ['sessionId', 'operations'],
    },
  },
  {
    name: 'validate_diagram',
    description: '对当前图表执行静态几何校验（重叠、穿框、孤节点、边交叉检测）。返回冲突报告。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        tolerance: { type: 'number', description: 'AABB容忍误差（px），默认1' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'export_diagram',
    description: '导出图表为.drawio文件（PNG/SVG待Phase 3）。文件保存到~/Downloads/目录。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        format: {
          type: 'string',
          enum: ['drawio', 'png', 'svg'],
          description: '导出格式，默认drawio',
        },
      },
      required: ['sessionId'],
    },
  },
  // === P1 增强工具 ===
  {
    name: 'smart_fix',
    description: '对校验冲突自动微调消除（位移修复重叠节点）。最多5轮fix-validate循环。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        maxRounds: { type: 'number', description: '最大修复轮数，默认5' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'add_page',
    description: '追加一个新的空白页面。返回新页面的索引。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        name: { type: 'string', description: '页面名称（可选，默认Page-N）' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'auto_layout',
    description: '对已有拓扑重新执行ELK布局算法，只改坐标不改内容语义。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'find_cells',
    description: '按关键词或类型搜索图表中的cell（节点/边）。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        query: { type: 'string', description: '搜索关键词（匹配label和id）' },
        type: { type: 'string', enum: ['vertex', 'edge'], description: '过滤cell类型' },
      },
      required: ['sessionId'],
    },
  },
  // === P2 锦上添花 ===
  {
    name: 'rename_page',
    description: '重命名指定索引的页面。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        pageIndex: { type: 'number', description: '页面索引（从0开始）' },
        name: { type: 'string', description: '新页面名称' },
      },
      required: ['sessionId', 'pageIndex', 'name'],
    },
  },
  {
    name: 'delete_page',
    description: '删除指定索引的页面（拒绝删除最后一页）。删除后自动重新编号。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        pageIndex: { type: 'number', description: '页面索引（从0开始）' },
      },
      required: ['sessionId', 'pageIndex'],
    },
  },
  {
    name: 'apply_theme',
    description: '套用预定义主题（light/dark/minimal/business）。完整外观变化待Phase 3。',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: '会话ID' },
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'minimal', 'business'],
          description: '主题名称',
        },
      },
      required: ['sessionId', 'theme'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  start_session: startSessionHandler,
  generate_diagram: generateDiagramHandler,
  get_diagram: getDiagramHandler,
  list_pages: listPagesHandler,
  edit_diagram: editDiagramHandler,
  validate_diagram: validateDiagramHandler,
  smart_fix: smartFixHandler,
  export_diagram: exportDiagramHandler,
  add_page: addPageHandler,
  auto_layout: autoLayoutHandler,
  find_cells: findCellsHandler,
  rename_page: renamePageHandler,
  delete_page: deletePageHandler,
  apply_theme: applyThemeHandler,
};
