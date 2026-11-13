# Build Plan: Lightweight Collaborative Doc Editor

Timebox: about 3h50m left at planning time. Budget: **~3h build, ~45m docs and video.**
If a phase runs more than 15 minutes over, cut its scope rather than borrowing from later phases.

## Stack: built on what I already know

| Concern | Choice | Familiar? |
|---|---|---|
| Frontend | **React + Vite**, React Router | Yes |
| Backend | **Node + Express** REST API | Yes |
| DB | **Supabase Postgres** | Yes |
| Auth | **Supabase Auth** (email/password, seeded users) | Yes |
| Styling | Plain CSS with variables (or Tailwind), our own look | Yes |
| Rich-text editor | **Tiptap** | **New**. React components plus a toolbar. Any rich-text editor needs a library like this. |
| Upload | `multer` (Express upload middleware), `mammoth` (.docx → HTML) | **New, but small**. Each is one function call. |
| Validation | `zod` | **New, small**. Request body schemas. |
| Tests | **Vitest + supertest** | **New, small**. Jest-style syntax. |
| Deploy | **Vercel**: Vite build as static files, Express as one serverless function at `/api/*` | Probably new. One project, one URL, no CORS. |

### How the pieces talk to each other
```
React (Vite) ──login──▶ Supabase Auth ──▶ access token (JWT)
React ──fetch /api/* + Bearer token──▶ Express
Express ──verify token (supabase.auth.getUser)──▶ userId
Express ──getAccess(userId, docId)──▶ allow / 403
Express ──service-role client──▶ Supabase Postgres
```
**The decision to explain in the video:** all permission logic lives in Express (`getAccess`), not in Supabase RLS policies.
The rule is then plain JavaScript that I can read, unit test and walk through. Express uses the service-role key, which stays server-side only and never reaches the browser.

## Data model (Supabase)

```
auth.users       (managed by Supabase)
profiles         id → auth.users, email, name
documents        id, owner_id → profiles, title, content (jsonb, Tiptap doc), created_at, updated_at
document_shares  document_id → documents, user_id → profiles, role ('viewer'|'editor'), PK(document_id, user_id)
```

`getAccess(userId, doc, shares) → 'owner' | 'editor' | 'viewer' | null` is a pure function, so it's easy to test.

## Folder layout
```
client/   React app (pages, components, api.js fetch wrapper)
server/   Express app (routes/, lib/access.js, lib/import.js, tests)
api/      index.js: re-exports the Express app for Vercel
supabase/ schema.sql, seed script
```

## Working rule: I stay in charge of the code, AI helps
- Before each phase, Claude explains the new pieces in 2–3 lines. I read every diff before it's merged.
- I write or line-by-line review the **core logic myself**: `getAccess`, the share route, the autosave hook.
- Keep `AI_LOG.md` as we go: what AI generated, what I changed or rejected, and why. `AI_WORKFLOW.md` gets written from this log.

## Git workflow
- `main` holds the scaffold, then gets each phase via a merge once it is tested.
- One branch per phase. Each phase ends with: runs locally, its checks pass, the Vercel preview works, then merge.

---

## Phase 0: Scaffold and deploy skeleton (`main`), ~25 min
Repo: `github.com/mk-ctrl/documentEditor` (public, empty). Secrets never get committed.

1. `git init`, `.gitignore` (node_modules, dist, `.env*` except `.env.example`), remote set to the repo.
2. A single `package.json` at the repo root, with scripts:
   - `dev`: Vite on :5173 and Express on :4000 together, with Vite proxying `/api` to Express.
   - `build`, `test`, `seed`.
3. `client/`: Vite React app, React Router, `lib/supabase.js` (anon key), `lib/api.js` (fetch wrapper that attaches the Bearer token), base CSS variables (the design tokens, filled in once the UI reference arrives).
4. `server/`: `app.js` exports the Express app (it does not call `listen`, so supertest and Vercel can both use it), `index.js` starts it locally, `lib/supabaseAdmin.js` (service-role key), and `GET /api/health`, which runs a 1-row database query.
5. `api/index.js` re-exports the app. `vercel.json` rewrites `/api/(.*)` to that function and everything else to `index.html` (so client-side routes work). It also adds a **daily scheduled call to `/api/health`** so the free Supabase project doesn't pause.
6. `supabase/schema.sql` creates `profiles`, `documents` and `document_shares` with indexes and `on delete cascade`, and enables RLS on every table with no policies. Browser requests then get no rows, so only Express can read data.
7. Vitest is set up, with one smoke test where supertest calls `GET /api/health`.
8. First commit to `main`, push, import the repo into Vercel, add the env vars, deploy.

**Needed from you:** Supabase project URL, anon key and service-role key (in `.env`, not the chat), plus running `schema.sql` in the Supabase SQL editor and linking the repo in Vercel (both through dashboard sign-ins).
**Done when:** `npm run dev` works locally, `npm test` passes, and the live Vercel URL shows the app with `/api/health` returning `{ ok: true, db: true }`.

## Phase 1: Auth and data layer (`phase-1/auth-data`), ~30 min
- Seed script that creates 3 users (alice, bob, carol, with one demo password that goes in the README) through the Supabase admin API, plus their profiles.
- Login page using Supabase Auth, a "quick switch" list of demo users, logout, and protected routes.
- Express `requireAuth` middleware and `getAccess()` with unit tests.
- **Done when:** you can log in as alice or bob, and `/api/*` returns 401 without a token.

## Phase 2: Documents and editor (`phase-2/editor`), ~60 min. The core of the product.
- API: `POST /api/documents`, `GET /api/documents` (returns `{ owned, shared }`), `GET/PATCH/DELETE /api/documents/:id`, with zod validation.
- Dashboard: "My documents" and "Shared with me" sections, plus a New document button.
- Editor: inline title rename, toolbar (B / I / U / H1 / H2 / bullet list / numbered list / undo / redo).
- **Autosave** (debounced, about 800ms) with a status of Saving… / Saved / Failed, retry. Read-only for viewers.
- **Done when:** you create a doc, format it, refresh, and the formatting is identical. Rename persists.

## Phase 3: Sharing (`phase-3/sharing`), ~35 min
- Share dialog (owner only): enter an email, choose viewer or editor, see the access list, remove access.
- `POST/DELETE /api/documents/:id/shares`. Errors for an unknown email, sharing with yourself, and non-owners.
- Dashboard badges ("Shared by Alice · Viewer").
- **Done when:** alice shares with bob as viewer and bob sees it read-only. Upgrade bob to editor and bob can edit. Carol gets a 403 page.

## Phase 4: File upload (`phase-4/upload`), ~30 min
- "Import file" turns a `.txt`, `.md` or `.docx` file into a **new editable document**. Supported types are stated in the UI.
- `multer` in memory, 2 MB limit, type check on both client and server. Server converts the file to HTML: `mammoth` for .docx, `marked` for .md, paragraphs for .txt.
- The client loads that HTML into Tiptap, which drops any unsupported markup. That doubles as sanitization.
- **Done when:** a .docx with headings and lists keeps that structure. A .pdf is rejected with a clear message.

## Phase 5: Hardening and tests (`phase-5/quality`), ~25 min
- Tests: the access matrix (owner / editor / viewer / stranger × read / write / share / delete), import conversion, and a supertest API test (alice shares, then bob reads).
- 404 and 403 pages, error toasts, empty and loading states.

## Phase 6: Docs and submission (`main`), ~45 min
- `README.md`, `ARCHITECTURE.md`, `AI_WORKFLOW.md`, `SUBMISSION.md`, `VIDEO_URL.txt`, screenshots. Record the walkthrough and upload to Drive.

## Stretch (only if 40+ minutes are left after Phase 5)
- Export to Markdown / PDF (about 20 minutes). *(Recommended)*

## Deliberate scope cuts (stated in the README)
- No real-time co-editing. Last write wins.
- No sign-up or password reset. Users are seeded.
- No comments, images or tables in the editor.
- Upload creates new docs only.
