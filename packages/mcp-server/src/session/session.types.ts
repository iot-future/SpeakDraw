/** draw.io cell 信息（从 XML 解析或 agent 操作产出） */
export interface CellInfo {
  id: string;
  type: 'vertex' | 'edge';
  label: string;
  parent: string;
  source?: string;
  target?: string;
  style?: string;
}

/** 页面信息 */
export interface PageInfo {
  index: number;
  name: string;
  nodeCount: number;
  hasContent: boolean;
}

/** 会话状态 */
export interface Session {
  id: string;
  title: string;
  createdAt: number;
  xml: string;
  cells: CellInfo[];
  pages: PageInfo[];
}
