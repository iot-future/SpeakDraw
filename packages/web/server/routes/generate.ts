import { Router } from 'express';
import { z } from 'zod';
import { layoutDiagram, serialize } from '@ai-diagram/core';
import type { IRDiagram } from '@ai-diagram/shared';
import { createSession, getSession } from './session';
import { callLLM } from './proxy/llm-proxy';

const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  hunyuan: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-latest',
  deepseek: 'deepseek-chat',
  hunyuan: 'hunyuan-lite',
};

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

  const { text, apiKey, provider, model: modelOverride, sessionId } = parsed.data;
  const model = modelOverride ?? DEFAULT_MODELS[provider];
  const endpoint = PROVIDER_ENDPOINTS[provider];

  if (!model || !endpoint) {
    res
      .status(400)
      .json({ error: { code: 'UNKNOWN_PROVIDER', message: `Unknown provider: ${provider}` } });
    return;
  }

  const session = sessionId ? (getSession(sessionId) ?? createSession(sessionId)) : createSession();

  try {
    // Step 1: Call LLM directly (no self-HTTP call)
    const ir = (await callLLM({ text, apiKey, provider, model, endpoint })) as IRDiagram;

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
