import { Router } from 'express';

interface ServerSession {
  id: string;
  xml: string | null;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: number }[];
  createdAt: number;
}

const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const sessions = new Map<string, ServerSession>();

// Periodic cleanup of stale sessions (runs every 5 minutes)
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.createdAt > SESSION_MAX_AGE_MS) {
        sessions.delete(id);
      }
    }
  },
  5 * 60 * 1000,
);

// Allow the Node process to exit even if the interval is active
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function createSession(id?: string): ServerSession {
  const sessionId = id ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session: ServerSession = {
    id: sessionId,
    xml: null,
    messages: [],
    createdAt: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(id: string): ServerSession | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export const sessionRouter: Router = Router();

sessionRouter.post('/', (_req, res) => {
  const session = createSession();
  res.json({ sessionId: session.id, createdAt: session.createdAt });
});

sessionRouter.get('/:id', (req, res) => {
  const session = getSession(req.params['id']!);
  if (!session) {
    res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    return;
  }
  res.json({ sessionId: session.id, xml: session.xml, messages: session.messages });
});

sessionRouter.delete('/:id', (req, res) => {
  const deleted = deleteSession(req.params['id']!);
  if (!deleted) {
    res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } });
    return;
  }
  res.json({ success: true });
});
