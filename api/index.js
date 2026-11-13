// Vercel serverless function. vercel.json rewrites every /api/* request here,
// and the original URL is preserved, so Express routes match exactly as they do locally.
export { default } from '../server/app.js';
