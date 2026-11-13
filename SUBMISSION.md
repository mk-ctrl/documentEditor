# Submission: Mirun Kaushik
### Ajaia: AI-Native Full Stack Developer Assignment
**Product:** Quire, a lightweight collaborative document editor

---

## 1. Links at a glance

| What | Link |
|---|---|
| 📁 **Submission folder (Google Drive)** | https://drive.google.com/drive/folders/13i7BLW_pZeh31AHpOVRmq3lQSJF_Kspd?usp=sharing |
| 🌐 **Live app** | https://documenteditor-ivory.vercel.app |
| 🎥 **Walkthrough video** | https://drive.google.com/file/d/1ud11XIsqGD1n1zBZl3CPVsLk1O3cenkX/view?usp=sharing |
| 💻 **Source code (GitHub)** | https://github.com/mk-ctrl/documentEditor |
| 🩺 **API health check** | https://documenteditor-ivory.vercel.app/api/health → `{"ok":true,"db":true}` |

Everything is free to use. No paid service or dependency is needed to review or run it.

---

## 2. Test accounts

**Fastest way in:** open the live app and click a name chip (**Alice**, **Bob** or **Carol**) on the sign-in card. You're signed in with one click. You can also **create your own account** with *No account yet? Create one*.

| User | Email | Password |
|---|---|---|
| Alice Park | `alice@example.com` | `mirun2005` |
| Bob Rivera | `bob@example.com` | same |
| Carol Singh | `carol@example.com` | same |

**Pre-shared data, so sharing can be tested right away:**

| Document | Owner | Shared with | Role |
|---|---|---|---|
| Welcome to Quire | Alice | Bob | Viewer (read-only) |
| Q3 planning notes | Bob | Alice | Editor (can edit) |

---

## 3. A 3-minute review path

1. **Sign in as Alice** (one click). The dashboard ("Your desk") shows **My documents** and **Shared with me** separately. The **All / Mine / Shared** tabs filter them.
2. Click **Blank page**, type a title, press **Enter**, and write. Use the toolbar for **bold / italic / underline**, **H1 / H2** and **bulleted / numbered lists**. Watch the status pill go *Unsaved changes → Saving… → Saved*.
3. **Refresh the page.** The title and all formatting come back exactly.
4. Click **Share**, add `carol@example.com` as **Can view**.
5. **Sign out**, click **Carol**. The document is under **Shared with me**. Open it: it's **read-only**, with no toolbar and a viewer banner.
6. Sign back in as **Alice**, open **Share**, switch Carol to **Can edit**. Carol can now edit. **Remove** her and she gets a "This page is private" screen.
7. Back on the dashboard, **drag a `.txt`, `.md` or `.docx` file onto the page** (or click **Import file**). It becomes a new, editable document with its headings, bold and lists kept. Sample files are in `documentEditor/samples/` inside the source zip.

---

## 4. What's in the Drive folder

```
Ajaia-Submission-Mirun-Kaushik/
├── SUBMISSION.md              ← this file
├── README.md                  ← setup, run, deploy, tests, scope
├── ARCHITECTURE.md            ← architecture note: design, data model, decisions, tradeoffs
├── HOW_IT_WORKS.md            ← plain-language walkthrough of every flow, end to end
├── AI_WORKFLOW.md             ← AI workflow note: tools, speed-ups, what was changed/rejected, verification
├── AI_LOG.md                  ← detailed per-phase log behind the AI workflow note
├── PLAN.md                    ← the phased build plan and timeline used during the timebox
├── VIDEO_URL.txt              ← walkthrough video link
├── documentEditor-source.zip  ← full source code (identical to the GitHub repo)
└── screenshots/
    ├── 01-landing-hero-signin.jpg
    ├── 02-landing-write-panel.jpg
    ├── 03-landing-share-panel.jpg
    ├── 04-dashboard-desk.jpg
    ├── 05-editor-outline-stats.jpg
    ├── 06-share-dialog.jpg
    ├── 07-viewer-read-only.jpg
    └── 08-dashboard-mobile.jpg
```

### Inside `documentEditor-source.zip`

```
documentEditor/
├── client/                 React 19 + Vite front end
│   ├── index.html
│   ├── public/             favicon
│   └── src/
│       ├── pages/          Login.jsx (landing + sign in/up), Dashboard.jsx, EditorPage.jsx, NotFound.jsx
│       ├── components/     ShareDialog, Toolbar, DocCard, AppHeader, Avatar, Brand, Shapes, RequireAuth
│       │   ├── landing/    TopBar, HeroCollage, FeaturePanel, Mockups, DotNav
│       │   ├── dashboard/  DeskHero, DashToolbar, Shelf, EmptyShelf, DropOverlay, useFileDrop
│       │   └── editor/     DocOutline, DocStats, SaveIndicator, copyText, icons
│       ├── lib/            api.js, auth.jsx, supabase.js, useAutosave.js, editorExtensions.js,
│       │                   useReveal.js, toast.jsx, time.js
│       └── *.css           styles.css (design tokens), app/landing/dashboard/editor.css
├── server/                 Express 5 API
│   ├── app.js              builds the app (used by local dev, Vercel and tests)
│   ├── index.js            local dev entry (port 4000)
│   ├── middleware/         requireAuth.js
│   ├── routes/             documents.js, shares.js, auth.js, me.js, health.js
│   ├── lib/                access.js (permissions), validation.js (zod), importFile.js,
│   │                       supabaseAdmin.js, httpError.js
│   └── test/               4 test files, 41 tests
├── api/index.js            Vercel serverless entry (re-exports the Express app)
├── supabase/schema.sql     tables, triggers, RLS lock-down
├── scripts/seed.js         demo users + starter documents
├── samples/                product-brief.md, meeting-notes.txt, quarterly-review.docx
├── vercel.json             rewrites + daily keep-alive cron
├── .env.example            every environment variable, with placeholders
└── *.md                    README, ARCHITECTURE, HOW_IT_WORKS, AI_WORKFLOW, AI_LOG, PLAN, SUBMISSION
```

No secrets are included. `.env` and `node_modules/` are excluded. `.env.example` has placeholders only.

---

## 5. Requirements coverage

### 5.1 Document creation and editing

| Requirement | Status | Where / how |
|---|:-:|---|
| Create a new document | ✅ | **Blank page** tile, **+ New document** button, `POST /api/documents` |
| Rename a document | ✅ | Inline title on the page, autosaved (`PATCH /api/documents/:id`) |
| Edit content in the browser | ✅ | Tiptap (ProseMirror) rich-text editor |
| Save and reopen | ✅ | Autosave 800 ms after typing stops; reopen from the dashboard; formatting identical after refresh |
| Bold / italic / underline | ✅ | Toolbar + Ctrl/Cmd+B / I / U |
| Headings or text size | ✅ | H1, H2 (H3 via shortcut), body text |
| Bulleted / numbered lists | ✅ | Toolbar + Markdown-style shortcuts (`- `, `1. `) |
| Usable, coherent flow | ✅ | Save status with retry, Ctrl/Cmd+S, unsaved-changes warning, heading outline, word count |

### 5.2 File upload

| Requirement | Status | Where / how |
|---|:-:|---|
| Upload a file into the workflow | ✅ | **Import file** button or **drag-and-drop anywhere on the dashboard** |
| Product-relevant behaviour | ✅ | The file becomes a **new editable document**, keeping headings, bold, italic and lists |
| Supported types stated in UI + README | ✅ | **`.txt`, `.md`, `.docx` only, max 2 MB**, shown on the dashboard hero, import tile, drop overlay and README |
| Validation | ✅ | Type, size, empty-file, real-`.docx` (ZIP signature) and UTF-8 checks. Errors: 415 / 413 / 400 |

### 5.3 Sharing

| Requirement | Status | Where / how |
|---|:-:|---|
| A document owner | ✅ | `documents.owner_id`, set from the login token, never from the request body |
| Grant another user access | ✅ | Share dialog: add by email as **viewer** or **editor**, change role, remove |
| Owned vs shared distinction | ✅ | Separate **My documents** / **Shared with me** shelves, tabs, role chips, owner avatar, viewer banner |
| Working access logic | ✅ | Enforced on the server for every request (see §7) and covered by tests |
| Stretch: role-based permissions | ✅ | Viewer (read) vs editor (read + write). Only the owner can share or delete |

### 5.4 Persistence

| Requirement | Status | Where / how |
|---|:-:|---|
| Documents survive refresh | ✅ | Supabase Postgres |
| Formatting preserved | ✅ | Content stored as **Tiptap JSON** (structure, not HTML). An integration test asserts an exact round trip |
| Shared access demonstrable | ✅ | `document_shares` table + seeded shares + live test accounts |

### 5.5 Product and engineering quality

| Requirement | Status | Where / how |
|---|:-:|---|
| Setup and run instructions | ✅ | `README.md` → *Run locally* |
| Working deployment | ✅ | Vercel (front end + Express as one serverless function) + Supabase |
| Validation and error handling | ✅ | zod on every request body, central JSON error handler, 401/403/404/409/413/415 with readable messages, friendly error pages, toasts |
| At least one meaningful automated test | ✅ | **41 tests**, including integration tests against the real database (see §8) |
| Short architecture note | ✅ | `ARCHITECTURE.md` (+ `HOW_IT_WORKS.md`) |
| AI workflow note | ✅ | `AI_WORKFLOW.md` (+ `AI_LOG.md`) |

### 5.6 Deliverables checklist

| Deliverable | Status |
|---|:-:|
| Source code | ✅ `documentEditor-source.zip` + GitHub |
| `README.md` with local setup and run instructions | ✅ |
| Architecture note (Markdown) | ✅ `ARCHITECTURE.md` |
| AI workflow note (Markdown) | ✅ `AI_WORKFLOW.md` |
| `SUBMISSION.md` listing exactly what is included | ✅ this file |
| Live product URL | ✅ https://documenteditor-ivory.vercel.app |
| Text file with the walkthrough video URL | ✅ `VIDEO_URL.txt` |
| Screenshots | ✅ `screenshots/` (8 images) |
| Credentials / seeded users for sharing | ✅ §2 |

---

## 6. Architecture in brief

```
 Browser (React + Vite)
   ├── Supabase Auth ── login only ──▶ access token
   └── fetch /api/*  + Bearer token
            │
            ▼
 Express 5 (one Vercel serverless function)
   ├── requireAuth      → verifies the token with Supabase, sets req.user
   ├── zod              → validates every request body
   ├── requireDocAccess → the single permission check (owner / editor / viewer)
   └── Supabase secret key (server-only) ──▶ Postgres
```

**Key decisions:**

1. **Permissions live in one tested function on the server** (`server/lib/access.js`), not in scattered SQL policies. Row Level Security is **on with no policies**, so the browser's public key can't read any table (verified: it returns 0 rows). All data goes through Express, which calls `requireDocAccess` on every document route.
2. **Ownership is a column, not a share row.** A document can never lose its owner, and "owned vs shared" is a simple split. Sharing is an upsert on `(document_id, user_id)`.
3. **Content is stored as editor JSON, not HTML.** Structure round-trips exactly, and there's no stored HTML to sanitize on read.
4. **Import: the server parses, the client sanitizes through the editor's own schema.** The server enforces size, type and encoding limits and converts with mammoth, marked or plain text. The browser then keeps only what the editor supports, dropping scripts, event handlers, images and links. One definition of "what a document can contain" serves both typing and importing.
5. **One Express app, three entry points.** `createApp()` is reused by local dev, the Vercel function and the tests.
6. **Deploy first.** The scaffold was live on Vercel before any features were built, which removed deployment risk early. A daily cron hits `/api/health` so the free Supabase project never pauses.

**Data model** (`supabase/schema.sql`):

```
profiles         id → auth.users, email, name            (created by a trigger on sign-up)
documents        id, owner_id → profiles, title, content (jsonb), created_at, updated_at (trigger)
document_shares  document_id → documents, user_id → profiles, role ∈ {viewer, editor}
                 PK (document_id, user_id), on delete cascade
```

Full details: `ARCHITECTURE.md`. A step-by-step walkthrough of every flow, including exactly what happens on the backend during an upload: `HOW_IT_WORKS.md`.

---

## 7. Access control

| Role | Read | Edit | Share | Delete |
|---|:-:|:-:|:-:|:-:|
| Owner | ✓ | ✓ | ✓ | ✓ |
| Editor | ✓ | ✓ | | |
| Viewer | ✓ | | | |
| No access | | | | |

- No token or an invalid token → **401**. The UI clears the session and returns to sign-in.
- Unknown or malformed document id → **404**. The document exists but you have no role, or your role can't perform the action → **403**.
- The client can't set `owner_id` or other fields: request schemas are strict, and ownership always comes from the verified token.
- Share validation: unknown email → **404**, sharing with the owner → **400**, invalid role → **400**, non-owner → **403**.

---

## 8. Testing

**41 tests in 4 files, all passing.** Run with `npm test`.

| File | Covers |
|---|---|
| `server/test/access.test.js` | Every role × action in the table above. A share on a *different* document grants nothing. An unknown action throws instead of allowing it. |
| `server/test/importFile.test.js` | `.txt` / `.md` / `.docx` conversion (the `.docx` is generated in memory). HTML in `.txt` is escaped. Rejects `.pdf` (415), empty, fake `.docx` and non-UTF-8 files. Upload requires sign-in. |
| `server/test/documents.api.test.js` | **Integration, against the real Supabase project with the three seeded users:** create → format → reopen with identical content, owned/shared lists, viewer and stranger blocked (403), the full share lifecycle (grant → upgrade → revoke), import limits (415 / 413), sign-up (new user signs in, gets a profile, can be shared with; duplicate → 409), validation including no `owner_id` spoofing. Test data is cleaned up. |
| `server/test/app.test.js` | 401 without a token or with a forged one, JSON 404, malformed JSON → 400, sign-up validation, DB health. |

**Manual verification, every phase:** each feature was clicked through in a real browser before merging. The final UI was checked at 1280 px, 1440 px and 375 px (no horizontal scroll), as Alice and as Bob.

---

## 9. Status

### Working end to end
- Sign-up, sign-in and sign-out, plus one-click demo users.
- Create, rename, edit, delete and reopen documents.
- Rich text: bold, italic, underline, H1/H2, bulleted and numbered lists, undo/redo, keyboard shortcuts.
- Autosave with visible status, retry on failure, Ctrl/Cmd+S, and an unsaved-changes warning.
- Dashboard: owned vs shared shelves, All/Mine/Shared tabs, title search (`/` to focus), sort, drag-and-drop import.
- Sharing by email as viewer or editor, role changes and revoking, all enforced on the server.
- Import of `.txt`, `.md` and `.docx` (≤ 2 MB) as new documents, sanitized through the editor schema.
- Editor extras: heading outline, word count and reading time, copy link, viewer banner, 403/404 pages.
- Persistence in Postgres, validation and error handling, 41 tests, live Vercel deployment.
- Responsive down to 375 px, keyboard accessible, respects reduced-motion settings.

### Intentionally not built (scope cuts)
| Cut | Why |
|---|---|
| Real-time co-editing / live cursors | A project of its own (CRDTs such as Yjs). Saves are last-write-wins. |
| Comments, suggestion mode, version history | Chose depth in editing, sharing and import over breadth |
| Export (PDF / Markdown) | Stretch item, dropped to protect core quality |
| Images, tables, links in the editor | Kept the schema small and safe. Imports drop these. |
| Import into an existing document | Import creates new documents, which is clear and testable. The same pipeline could insert into a doc later. |
| Email verification and password reset | Sign-up creates confirmed accounts so reviewers can test instantly. Production would add verification and rate limiting. |

### Known limitations
- Concurrent edits by two editors: the last save wins, with no conflict warning yet.
- The *Delete* confirmation uses the browser's native dialog.
- Integration tests need a configured Supabase `.env`. Without one they are skipped, not failed.

### What I'd build next (2–4 hours)
1. **Stale-write protection:** send `updated_at` with each save, return 409 if the document changed, and offer reload or overwrite.
2. **Export** to Markdown and PDF.
3. **Version snapshots** on save, with restore.
4. **Live presence, then real-time editing** with Yjs + Supabase Realtime.

---

## 10. Run it locally

Requires **Node 20.12+** and a free Supabase project.

```bash
git clone https://github.com/mk-ctrl/documentEditor.git   # or unzip documentEditor-source.zip
cd documentEditor
npm install
cp .env.example .env      # fill in the Supabase URL, publishable key, secret key, demo password
```

1. In Supabase → SQL Editor, run `supabase/schema.sql`.
2. `npm run seed` creates Alice, Bob, Carol and the starter documents.
3. `npm run dev` starts the app at http://localhost:5173 (API on :4000).
4. `npm test` runs the 41 tests.

Full instructions, environment variables and Vercel deployment steps: `README.md`.

---

## 11. Tech stack

| Layer | Choice |
|---|---|
| Front end | React 19, Vite, React Router |
| Editor | Tiptap 3 (ProseMirror) |
| Back end | Node.js, Express 5 |
| Auth + database | Supabase (Auth + Postgres) |
| Validation | zod |
| File import | multer (in-memory, 2 MB), mammoth (.docx), marked (.md) |
| Tests | Vitest, supertest |
| Hosting | Vercel (static front end + one serverless function, daily cron) |
| Styling | Plain CSS with design tokens. Figtree + Newsreader fonts. No UI kit. |

---

## 12. How AI was used (summary)

- **Tool:** Claude Code (Claude Opus 5.5) as a pair programmer, in phases, each on its own Git branch. A branch was merged only after its tests passed and it had been checked in the browser.
- **Where it sped things up:** scaffolding, the Vercel/Express wiring, test suites (the full permission matrix, the share-lifecycle integration test, an in-memory `.docx` fixture), and a parallel multi-agent UI redesign with adversarial reviewers.
- **What I changed or rejected:**
  - Rejected the first proposed stack (Next.js + Neon + Drizzle) for React + Express + Supabase, which I can explain line by line.
  - Took only the *design language* of the UI reference, not its brand or assets.
  - Rejected a logo that read as a search icon.
- **Real bugs caught and fixed:**
  - A health check that passed even before the tables existed.
  - An ambiguous Supabase join that returned 500.
  - A dev-server port collision.
  - Revoked sessions leaving the UI stuck.
  - Contrast and screen-reader issues found by the UI reviewers.
- **Verification:** 41 automated tests (including against the real database), manual browser checks every phase, live deploy checks, and a security review of the generated code (secret key server-only, RLS lock-down verified, no `owner_id` spoofing, import sanitization).

Full note: `AI_WORKFLOW.md`. Per-phase detail: `AI_LOG.md`.

---

## 13. Build history

Built in phases on separate branches, each merged into `main` after tests and a browser check:

| Phase | Branch | Delivered |
|---|---|---|
| 0 | `main` | Scaffold, schema, Vercel deploy, health check |
| 1 | `phase-1/auth-data` | Supabase auth, demo users, permission rules + tests, design system |
| 2 | `phase-2/editor` | Dashboard, rich-text editor, autosave, document API |
| 3 | `phase-3/sharing` | Viewer/editor sharing, share dialog, lifecycle tests |
| 4 | `phase-4/upload` | `.txt` / `.md` / `.docx` import with sanitization |
| 5 | `phase-5/signup` | Account sign-up |
| 6 | `phase-6/ui-flow` | Reference-inspired scroll-story landing, desk dashboard, richer editor |
| docs | `docs/*` | README, architecture, how-it-works, AI workflow, submission |

Commit history: https://github.com/mk-ctrl/documentEditor/commits/main

---

*Thank you for reviewing. Questions about any part of this are welcome.*
