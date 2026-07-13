import { createServer, type Server } from 'node:http';
import type { SessionManager } from '../session/session-manager';
import { embedHtml } from './embed-template.js';

/**
 * 轻量 HTTP 预览服务器。为每个 session 提供 diagrams.net embed 预览页面。
 * 使用 Node 内置 http 模块，零额外依赖。
 */
export class PreviewServer {
  private server: Server | null = null;
  private port = 0;
  private sessionManager: SessionManager | null = null;

  /**
   * 启动预览服务器。
   * @returns 分配的端口号
   */
  start(sessionManager: SessionManager): Promise<{ port: number }> {
    return new Promise((resolve, reject) => {
      this.sessionManager = sessionManager;
      this.server = createServer((req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end('Bad Request');
          return;
        }

        // GET /preview/:sessionId
        const previewMatch = req.url.match(/^\/preview\/([a-zA-Z0-9-]+)$/);
        if (previewMatch) {
          const sessionId = previewMatch[1]!;
          const session = this.sessionManager?.getSession(sessionId);
          if (!session) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Session not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(embedHtml(sessionId));
          return;
        }

        // GET /api/session/:sessionId/xml
        const apiMatch = req.url.match(/^\/api\/session\/([a-zA-Z0-9-]+)\/xml$/);
        if (apiMatch) {
          const sessionId = apiMatch[1]!;
          const session = this.sessionManager?.getSession(sessionId);
          if (!session) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Session not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
          res.end(session.xml);
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address();
        if (addr && typeof addr === 'object') {
          this.port = addr.port;
          resolve({ port: this.port });
        } else {
          reject(new Error('Failed to get server address'));
        }
      });

      this.server.on('error', (err) => {
        this.server = null;
        this.sessionManager = null;
        reject(err);
      });
    });
  }

  /** 停止预览服务器 */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
      this.server = null;
      this.sessionManager = null;
    });
  }

  /** 获取指定 session 的预览 URL */
  getPreviewUrl(sessionId: string): string {
    return `http://localhost:${this.port}/preview/${sessionId}`;
  }
}
