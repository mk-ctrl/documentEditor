# Architecture note

## What I optimised for

With ~4 hours, I aimed for **a small number of things that work end to end and are hard to break**, over broad coverage:

1. **A trustworthy permission model.** Sharing is the feature most likely to be subtly wrong, so it gets one source of truth and the most tests.
2. **An editor that feels finished.** Autosave with honest status, keyboard shortcuts, and formatting that survives reloads exactly.
3. **A deploy that works on day one.** The scaffold was deployed before any features, so deployment risk was retired first.
4. **A stack I can explain line by line.** React, Express and Supabase are tools I already know. AI-suggested alternatives (Next.js, Drizzle, Neon) were rejected for that reason.

## System overview

```
Browser (React + Vite)
 ├─ supabase-js (publishable key) ── login only ──▶ Supabase Auth ──▶ access token (JWT)
 └─ fetch /api/*  + Authorization: Bearer <token>
        │
        ▼
Express 5 (one Vercel serverless function; plain Node locally)
 ├─ requireAuth: supabase.auth.getUser(token) → req.user
 ├─ zod: validate every body
 ├─ requireDocAccess(user, doc, action): the ONLY permission check
 └─ supabase-js (secret key, server-only) ──▶ Postgres
```

**Why permissions live in Express, not RLS policies:** RLS is enabled on every table **with no policies**, so the browser's publishable key can read nothing. All data goes through Express, where access control is a plain function:

```
role    │ read │ write │ share │ delete
owner   │  ✓   │   ✓   │   ✓   │   ✓
editor  │  ✓   │   ✓   │       │
viewer  │  ✓   │       │       │
(none)  │      │       │       │
```

`getRole()` and `can()` are pure functions with an exhaustive unit test, and `requireDocAccess()` wraps them with the DB lookup and returns 404 or 403. Every document route calls it, so there is one place to read, test and audit. The tradeoff: the secret key is powerful, so it lives only in server env vars, and the DB is closed to direct browser access by default.

## Data model

```
auth.users ──1:1── profiles(id, email, name)                 -- created by a trigger on sign-up
profiles ──1:N── documents(id, owner_id, title, content jsonb, created_at, updated_at)
documents ──N:M── profiles  via  document_shares(document_id, user_id, role ∈ {viewer, editor})
```

- **Ownership is a column, not a share row**, so a document can never lose its owner, and "owned vs shared" is a simple split.
- `document_shares` has a composite PK `(document_id, user_id)`. Sharing is an **upsert**, so "change role" reuses the same endpoint.
- `on delete cascade` everywhere: deleting a doc removes its shares.
- `updated_at` is maintained by a DB trigger, and `title` length is checked in both zod and SQL.

## Editor and persistence

- **Tiptap (ProseMirror)** with a deliberately small schema: paragraphs, H1–H3, bold, italic, underline, lists, blockquote, rule.
- Content is stored as **Tiptap JSON**, not HTML. Structure round-trips exactly, which an integration test asserts, and there's no HTML to sanitize on read.
- **Autosave**: changes merge into a pending patch, which is sent 800 ms after the last keystroke.
  - Only one request is in flight at a time. Edits made during a save are sent right after it.
  - A failed save keeps its changes and shows *Retry*.
  - Ctrl+S flushes immediately, navigation flushes, and closing the tab with unsaved work warns.

## File import

Upload → **server** checks the type (`.txt` / `.md` / `.docx`), size (2 MB, multer), UTF-8 and the docx ZIP signature, then converts to HTML (mammoth / marked / escaped paragraphs) → **client** parses that HTML through the *same* Tiptap extension list as the editor → the result is created as a normal document.

Running the HTML through the editor's own schema **is** the sanitizer: anything the editor can't render (scripts, event handlers, images, links, tables) never makes it into the document. One definition of "what a document can contain" is shared by editing and importing.

## Deployment

- **Vercel**: Vite builds static assets, and `api/index.js` re-exports the same Express app as one function (`/api/*` rewrite). Locally, `server/index.js` serves the same app, and tests import it via `createApp()`. One code path, three entry points.
- **Supabase free tier** pauses after inactivity, so a daily Vercel cron calls `/api/health`, which runs a real query.

## Tradeoffs and what I'd do next

| Decision | Why | Cost / next step |
|---|---|---|
| Last-write-wins saves | Real-time sync (CRDT) is a project of its own | Next: optimistic concurrency with `updated_at` and 409 + prompt; later Yjs |
| Seeded users, no sign-up | The brief allows it, and reviewers can test sharing in one click | Sign-up via Supabase Auth is a small addition |
| Integration tests on real Supabase | They exercise the real permission path, not mocks | Slower (~28 s) and need a configured `.env`; they skip cleanly otherwise |
| Import creates new docs only | Clear, testable behavior | "Insert into current doc" reuses the same pipeline |
| Plain CSS with tokens, no UI kit | A distinct look (paper on a desk) instead of stock components | More CSS to own |
