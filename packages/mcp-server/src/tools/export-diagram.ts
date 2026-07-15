import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ToolHandler } from '../mcp-types.js';

export const exportDiagramHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const format = (args['format'] as string) ?? 'drawio';
  if (!['drawio', 'png', 'svg'].includes(format)) {
    throw new Error(`Unsupported format: ${format}. Supported: drawio, png, svg`);
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `speakdraw-${sessionId.slice(0, 8)}-${timestamp}.${format}`;
  const outputDir = join(homedir(), 'Downloads');
  const filePath = join(outputDir, filename);

  await writeFile(filePath, session.xml, 'utf-8');

  return {
    filePath,
    format,
  };
};
