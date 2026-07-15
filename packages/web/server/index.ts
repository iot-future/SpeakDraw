import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { sessionRouter } from './routes/session';
import { generateRouter } from './routes/generate';
import { validateRouter } from './routes/validate';
import { layoutRouter } from './routes/layout';
import { llmProxyRouter } from './routes/proxy/llm-proxy';

const app = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/generate', generateRouter);
app.use('/api/validate', validateRouter);
app.use('/api/layout', layoutRouter);
app.use('/api/proxy/llm', llmProxyRouter);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`AI-Diagram API server running on http://localhost:${config.port}`);
});
