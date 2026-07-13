import { StaticValidatorImpl } from '@ai-diagram/core';
import type { ToolHandler } from '../mcp-types.js';

export const validateDiagramHandler: ToolHandler = async (args, sessionManager) => {
  const sessionId = args['sessionId'] as string | undefined;
  if (!sessionId) throw new Error('sessionId is required');

  const session = sessionManager.getSession(sessionId);
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const validator = new StaticValidatorImpl();
  const tolerance = (args['tolerance'] as number) ?? 1;
  const report = await validator.validate(session.xml, { tolerance });

  return {
    passed: report.passed,
    conflicts: report.conflicts,
  };
};
