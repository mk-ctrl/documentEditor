// Local dev entry point. On Vercel, api/index.js serves the same app instead.
import app from './app.js';

// API_PORT (not PORT) so tools that set PORT for the Vite dev server don't make both servers collide.
const port = Number(process.env.API_PORT) || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
