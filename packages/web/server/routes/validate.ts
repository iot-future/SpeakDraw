import { Router } from 'express';
import { z } from 'zod';
import { StaticValidatorImpl } from '@speakdraw/core';

const validateRequestSchema = z.object({
  xml: z.string().min(1),
});

export const validateRouter: Router = Router();

validateRouter.post('/', async (req, res) => {
  const parsed = validateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parsed.error.message } });
    return;
  }

  const validator = new StaticValidatorImpl();
  const report = await validator.validate(parsed.data.xml);
  res.json(report);
});
