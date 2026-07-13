import { Router } from 'express';
import { z } from 'zod';

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
  anthropic: 'claude-3-5-sonnet-20240620',
  deepseek: 'deepseek-chat',
  hunyuan: 'hunyuan-lite',
};

export const llmProxyRouter: Router = Router();

llmProxyRouter.post('/', async (req, res) => {
  const parsed = llmRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });
    return;
  }

  const { text, apiKey, provider, model: modelOverride } = parsed.data;
  const model = modelOverride ?? DEFAULT_MODELS[provider]!;
  const endpoint = PROVIDER_ENDPOINTS[provider]!;

  try {
    const ir = await callLLM({ text, apiKey, provider, model, endpoint });
    res.json({ ir });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: { code: 'LLM_CALL_FAILED', message } });
  }
});

async function callLLM(params: {
  text: string;
  apiKey: string;
  provider: string;
  model: string;
  endpoint: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): Promise<any> {
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

  if (provider === 'openai' || provider === 'deepseek' || provider === 'hunyuan') {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`LLM API error: ${response.status} ${errBody}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content ?? '';
    return JSON.parse(content) as unknown;
  }

  // Anthropic uses different API format
  const response = await fetch(endpoint, {
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
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errBody}`);
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const content = data.content?.[0]?.text ?? '';
  return JSON.parse(content) as unknown;
}
