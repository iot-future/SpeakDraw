import type { ToolHandler } from '../mcp-types.js';

const THEMES: Record<string, { name: string; description: string }> = {
  light: { name: '浅色', description: '默认浅色主题' },
  dark: { name: '深色', description: '深色背景 + 浅色节点' },
  minimal: { name: '极简', description: '极简线条风格' },
  business: { name: '商务', description: '蓝色商务风格' },
};

export const applyThemeHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const theme = args['theme'] as string;
  if (!theme || !THEMES[theme]) {
    throw new Error(`Unknown theme: ${theme}. Available: ${Object.keys(THEMES).join(', ')}`);
  }

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  return {
    success: true,
    theme: THEMES[theme],
    message: `Theme "${THEMES[theme]!.name}" applied. Full theme rendering will be available in Phase 3.`,
  };
};
