import { smartFix, StaticValidatorImpl } from '@ai-diagram/core';
import type { ToolHandler } from '../mcp-types.js';

export const smartFixHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const maxRounds = (args['maxRounds'] as number) ?? 5;
  const validator = new StaticValidatorImpl();
  const result = smartFix(session.xml, validator, { maxFixRounds: maxRounds });

  sessionManager.updateSession(sessionId, { xml: result.xml });

  return {
    fixed: result.remainingConflicts.length === 0,
    remaining: result.remainingConflicts,
    rounds: result.rounds,
  };
};
