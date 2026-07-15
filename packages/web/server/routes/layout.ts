import { Router } from 'express';
import { z } from 'zod';
import { layoutDiagram, serialize } from '@speakdraw/core';
import { irDiagramSchema } from '@speakdraw/shared';

const layoutRequestSchema = z.object({
  ir: irDiagramSchema,
});

export const layoutRouter: Router = Router();

layoutRouter.post('/', async (req, res) => {
  const parsed = layoutRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });
    return;
  }

  const layout = await layoutDiagram(parsed.data.ir);
  const xml = serialize(parsed.data.ir, layout);
  res.json({ xml, layout });
});
