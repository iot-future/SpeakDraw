import { Router } from 'express';
import { z } from 'zod';
import { layoutDiagram, serialize } from '@ai-diagram/core';
import type { IRDiagram } from '@ai-diagram/shared';
import { createSession, getSession } from './session';
import { config } from '../config';

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
  const session = sessionId ? (getSession(sessionId) ?? createSession(sessionId)) : createSession();

  try {
    // Step 1: Call LLM proxy to get IR
    const llmRes = await fetch(`http://localhost:${config.port}/api/proxy/llm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey, provider, model }),
    });
    if (!llmRes.ok) {
      const errBody = (await llmRes.json()) as { error?: { message?: string } };
      throw new Error(errBody.error?.message ?? 'LLM call failed');
    }
    const llmData = (await llmRes.json()) as { ir: unknown };
    const ir = llmData.ir as IRDiagram;

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
