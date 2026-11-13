# Quire: a lightweight collaborative document editor

Create, format, import and share documents in the browser. Built for the Ajaia full-stack assignment in a ~4-hour timebox.

**Live app:** https://documenteditor-ivory.vercel.app
**Repo:** https://github.com/mk-ctrl/documentEditor

## Try it in 60 seconds (reviewers)

You can **create your own account** (*No account yet? Create one* on the login page, or go to `/signup`), or use the seeded accounts. On the login page, **click a name chip to sign in instantly**.

| User | Email | Password |
|---|---|---|
| Alice Park | `alice@example.com` | `mirun2005` |
| Bob Rivera | `bob@example.com` | same |
| Carol Singh | `carol@example.com` | same |

The seed data is already set up to show sharing:

- **"Welcome to Quire"**: owned by Alice, shared with **Bob as viewer**.
- **"Q3 planning notes"**: owned by Bob, shared with **Alice as editor**.

Suggested walkthrough:
1. Sign in as **Alice**. The dashboard shows *My documents* and *Shared with me* as separate shelves.
2. Click **+ New document**, type a title, then write with the toolbar (B / I / U, H1 / H2, bullet and numbered lists). It autosaves; refresh and the formatting is identical.
3. Click **Share**, add `carol@example.com` as *Can view*.
4. Sign out, then click **Carol**. The doc is under *Shared with me* and opens **read-only**. Back as Alice, switch Carol to *Can edit* and she can edit; *Remove* her and she gets a "This page is private" screen.
5. **↑ Import file** on the dashboard turns a `.txt`, `.md` or `.docx` (≤ 2 MB) into a new editable document. Sample files are in [`samples/`](samples/).

## Features

| Area | What works |
|---|---|
| Accounts | Sign up (name, email, password ≥ 8) with instant sign-in and no email confirmation step. Sign in, sign out, and one-click demo users. |
| Documents | Create, rename (inline title), edit, delete (owner), reopen. Owned vs shared shelves. |
| Editor | Tiptap rich text: bold, italic, underline, H1/H2, paragraph, bulleted and numbered lists, undo/redo, keyboard shortcuts. |
| Saving | Debounced autosave (0.8 s) with status (*Unsaved changes / Saving… / Saved / Not saved + Retry*), Ctrl+S, unsaved-changes warning on tab close. |
| Persistence | Postgres (Supabase). Content stored as Tiptap **JSON**, so structure round-trips exactly. |
| Sharing | Owner shares by email as **viewer** or **editor**, changes roles, revokes. Collaborator avatars in the editor. |
| Access control | Enforced on the server for every request: viewers can't write, only owners share or delete, strangers get 403. |
| Import | **Supported: `.txt`, `.md`, `.docx` only, max 2 MB.** Creates a new document. Unsupported markup is stripped. |
| Errors | Validation messages (zod), 403 / 404 pages, expired session goes back to login, failed saves keep your changes. |

## Tech stack

React 19 + Vite · Express 5 · Supabase (Postgres + Auth) · Tiptap 3 · zod · multer + mammoth + marked · Vitest + supertest · Vercel.

## Run locally

Requires **Node 20.12+** and a free Supabase project.

```bash
git clone https://github.com/mk-ctrl/documentEditor.git
cd documentEditor
npm install
cp .env.example .env        # then fill in the values (see below)
```

1. **Supabase keys:** Project Settings → API Keys. Put the project URL in both `*_URL` vars, the **publishable** key in `VITE_SUPABASE_ANON_KEY`, and the **secret** key in `SUPABASE_SERVICE_ROLE_KEY`. Pick a `DEMO_USER_PASSWORD` (8+ chars) and use the same value for `VITE_DEMO_PASSWORD`.
2. **Database:** paste [`supabase/schema.sql`](supabase/schema.sql) into the Supabase SQL Editor and run it. It is safe to re-run.
3. **Seed demo users and docs:** `npm run seed`. Re-running resets their passwords and starter docs, and signs those users out everywhere.
4. **Start:** `npm run dev`. This starts the app on http://localhost:5173 and the API on :4000 (Vite proxies `/api`).

| Command | What it does |
|---|---|
| `npm run dev` | React + Express with hot reload |
| `npm test` | All tests (unit + integration). Integration tests hit your Supabase project with the seeded users and are skipped if `.env` is missing. |
| `npm run build` | Production build of the client into `dist/` |
| `npm run seed` | Create or reset demo users and starter documents |

## Deploy (Vercel)

Import the repo in Vercel, keep the Vite preset (`vercel.json` sets build, output and rewrites), and add these env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_DEMO_PASSWORD`. `/api/*` runs Express as one serverless function. Everything else serves the SPA. A daily cron hits `/api/health` so the free Supabase project doesn't pause.

## Tests

41 tests across 4 files:

- **Access matrix** (`access.test.js`): every role × action (read / write / share / delete), plus "a share on another document grants nothing".
- **Import** (`importFile.test.js`): txt / md / docx conversion (docx generated in-memory), HTML escaping, rejects pdf, empty, fake-docx and non-UTF-8 files.
- **API integration** (`documents.api.test.js`) against real Supabase with three users:
  - create → format → reload equality
  - owned / shared lists
  - viewer and stranger 403s
  - full share lifecycle (grant → upgrade → revoke)
  - import limits (415 / 413)
  - sign-up (new user can sign in, gets a profile, can be shared with; duplicate email gives 409)
  - input validation, including that you can't spoof `owner_id`
- **App wiring** (`app.test.js`): sign-up validation, 401 without or with a forged token, JSON 404, malformed JSON gives 400, DB health.

## What's in scope, and what isn't

**Deliberately cut** (see [ARCHITECTURE.md](ARCHITECTURE.md) for why):
- Real-time co-editing and presence. Saves are last-write-wins.
- Password reset and email verification. Sign-up creates confirmed accounts directly, which suits an internal demo but would need verification and rate limiting in production.
- Comments, suggestions, version history, export, images, tables, links.
- Import into an *existing* document, and attachments.

**Known rough edges:**
- No conflict warning if two editors change the same doc at the same time. The last save wins.
- In a shared doc, the collaborator avatar row may not include the current viewer's own avatar. It's cosmetic only and access is correct.
- The *Delete* confirmation uses the browser's native `confirm()` dialog.

**Next 2–4 hours:**
1. Stale-write protection: send `updated_at` with each save and return 409 if the doc changed, with a reload / overwrite prompt.
2. Export to Markdown / PDF.
3. Version snapshots on save, with restore.
4. Live presence and real-time editing with Yjs + Supabase Realtime.

## Docs

- [HOW_IT_WORKS.md](HOW_IT_WORKS.md): plain-language walkthrough of every flow (login, editing, sharing, upload) end to end
- [ARCHITECTURE.md](ARCHITECTURE.md): design, data model, decisions and tradeoffs
- [AI_WORKFLOW.md](AI_WORKFLOW.md): how AI was used, what was changed or rejected, how it was verified
- [SUBMISSION.md](SUBMISSION.md): exactly what's included
