import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const llmRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  apiKey: z.string().min(1),
  provider: z.enum(['openai', 'anthropic', 'deepseek', 'hunyuan']),
  model: z.string().optional(),
});

// Provider API endpoint configs
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

/** LLM request timeout in milliseconds */
const LLM_TIMEOUT_MS = 90_000;

class LLMProxyError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'LLMProxyError';
  }
}

export const llmProxyRouter: Router = Router();

llmProxyRouter.post('/', async (req, res) => {
  const parsed = llmRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });
    return;
  }

  const { text, apiKey, provider, model: modelOverride } = parsed.data;
  const model = modelOverride ?? DEFAULT_MODELS[provider];
  const endpoint = PROVIDER_ENDPOINTS[provider];

  if (!model || !endpoint) {
    res
      .status(400)
      .json({ error: { code: 'UNKNOWN_PROVIDER', message: `Unknown provider: ${provider}` } });
    return;
  }

  try {
    const ir = await callLLM({ text, apiKey, provider, model, endpoint });
    res.json({ ir });
  } catch (err) {
    if (err instanceof LLMProxyError) {
      res.status(err.statusCode).json({ error: { code: 'LLM_CALL_FAILED', message: err.message } });
    } else {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: { code: 'LLM_CALL_FAILED', message } });
    }
  }
});

/** Fetch with timeout via AbortController */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new LLMProxyError('LLM request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callLLM(params: {
  text: string;
  apiKey: string;
  provider: string;
  model: string;
  endpoint: string;
}): Promise<unknown> {
  const { text, apiKey, provider, model, endpoint } = params;

  const systemPrompt = `You are a diagram generation assistant. Given a natural language description,
output a JSON object representing a diagram with nodes and edges.
The JSON must follow this TypeScript schema:

\`\`\`typescript
interface IRDiagram {
  type: 'er' | 'flowchart';
  direction: 'LR' | 'TB' | 'RL' | 'BT';
  nodes: Array<{
    id: string;
    label: string;
    type: 'entity' | 'service' | 'decision' | 'process' | 'dataStore' | 'note' | 'actor' | 'generic';
    group?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    type: 'association' | 'inheritance' | 'aggregation' | 'composition' | 'foreignKey' | 'flow';
  }>;
  groups?: Array<{
    id: string;
    label: string;
    type: 'container' | 'swimlane' | 'layer';
  }>;
}
\`\`\`

Output ONLY the JSON object, no markdown code fences, no explanations.`;

  // OpenAI-compatible format (OpenAI, DeepSeek, Hunyuan)
  if (provider === 'openai' || provider === 'deepseek' || provider === 'hunyuan') {
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    };
    // Only add response_format for providers known to support it
    if (provider === 'openai' || provider === 'deepseek') {
      requestBody['response_format'] = { type: 'json_object' };
    }

    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      },
      LLM_TIMEOUT_MS,
    );

    if (!response.ok) {
      logger.error(`LLM API error`, undefined, { provider, status: response.status });
      throw new LLMProxyError(
        `LLM API returned status ${response.status}`,
        response.status >= 500 ? 502 : 502,
      );
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    return parseLLMJson(content);
  }

  // Anthropic API format
  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    },
    LLM_TIMEOUT_MS,
  );

  if (!response.ok) {
    logger.error('Anthropic API error', undefined, { status: response.status });
    throw new LLMProxyError(
      `Anthropic API returned status ${response.status}`,
      response.status >= 500 ? 502 : 502,
    );
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const content = data.content?.[0]?.text ?? '';
  return parseLLMJson(content);
}

/**
 * Safely parse JSON from LLM output.
 * Handles markdown code fences and invalid JSON.
 */
function parseLLMJson(text: string): unknown {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    throw new LLMProxyError('LLM returned invalid JSON', 502);
  }
}
