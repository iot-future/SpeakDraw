import { Router } from 'express';
import { z } from 'zod';
import { layoutDiagram, serialize } from '@ai-diagram/core';
import type { IRDiagram } from '@ai-diagram/shared';
import { createSession, getSession } from './session';

const generateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  apiKey: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'deepseek', 'hunyuan']).default('openai'),
  model: z.string().optional(),
  sessionId: z.string().optional(),
});

export const generateRouter: Router = Router();

generateRouter.post('/', async (req, res) => {
  const parsed = generateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });
    return;
  }

  const { text, apiKey, provider, model, sessionId } = parsed.data;
  // TODO: In Task 5 (LLM proxy), apiKey/provider/model will be used for actual LLM call
  void apiKey;
  void provider;
  void model;
  const session = sessionId ? (getSession(sessionId) ?? createSession(sessionId)) : createSession();

  try {
    // Step 1: Call LLM to get IR
    // For now, use a browser-compatible fetch call pattern
    // The LLM client will be created in a later task
    // This route delegates to the LLM proxy
    const ir: IRDiagram = {
      type: 'flowchart',
      direction: 'TB',
      nodes: [],
      edges: [],
    };
    // TODO: In Task 5 (LLM proxy), this will be replaced with actual LLM call

    // Step 2: Layout
    const layout = await layoutDiagram(ir);

    // Step 3: Serialize
    const xml = serialize(ir, layout);

    // Update session
    session.xml = xml;
    session.messages.push({
      role: 'assistant',
      content: `Generated diagram: ${text}`,
      timestamp: Date.now(),
    });

    res.json({ sessionId: session.id, xml, ir, layout });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: { code: 'GENERATE_FAILED', message: String(err) } });
  }
});
