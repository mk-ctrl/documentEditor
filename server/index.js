// Local dev entry point. On Vercel, api/index.js serves the same app instead.
import app from './app.js';

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
