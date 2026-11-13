import express from 'express';
import healthRouter from './routes/health.js';
import { HttpError } from './lib/httpError.js';

// Builds the Express app WITHOUT calling listen(), so the same app is used by:
//   - server/index.js (local dev)
//   - api/index.js     (Vercel serverless function)
//   - supertest        (automated tests)
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/health', healthRouter);

  // Unknown API route → JSON 404 (never the HTML index page)
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

  // Central error handler: known errors keep their status, anything else is a 500 that doesn't leak internals.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body too large' });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Malformed JSON body' });
    }
    const status = err.status && err.status < 500 ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
  });

  return app;
}

export default createApp();
