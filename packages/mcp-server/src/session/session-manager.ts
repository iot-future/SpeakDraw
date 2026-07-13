import { randomUUID } from 'node:crypto';
import type { Session } from './session.types';

export interface SessionManagerOptions {
  maxSessions: number;
}

const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;

export class SessionManager {
  private sessions = new Map<string, Session>();
  private maxSessions: number;

  constructor(options: SessionManagerOptions = { maxSessions: 10 }) {
    this.maxSessions = options.maxSessions;
  }

  /** 创建新会话 */
  createSession(title = 'Untitled'): Session {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Maximum session limit (${this.maxSessions}) reached`);
    }
    const session: Session = {
      id: randomUUID(),
      title,
      createdAt: Date.now(),
      xml: EMPTY_XML,
      cells: [],
      pages: [{ index: 0, name: 'Page-1', nodeCount: 0, hasContent: false }],
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  /** 获取会话 */
  getSession(id: string): Session | undefined {
    const s = this.sessions.get(id);
    return s ? { ...s } : undefined;
  }

  /** 更新会话字段 */
  updateSession(
    id: string,
    patch: Partial<Pick<Session, 'xml' | 'cells' | 'pages' | 'title'>>,
  ): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (patch.xml !== undefined) session.xml = patch.xml;
    if (patch.cells !== undefined) session.cells = patch.cells;
    if (patch.pages !== undefined) session.pages = patch.pages;
    if (patch.title !== undefined) session.title = patch.title;
    return { ...session };
  }

  /** 删除会话 */
  deleteSession(id: string): boolean {
    return this.sessions.delete(id);
  }

  /** 列出所有会话 */
  listSessions(): Session[] {
    return Array.from(this.sessions.values()).map((s) => ({ ...s }));
  }
}
