# How Quire works, explained simply

This is a plain-language tour of the whole project: what the pieces are, how they talk to each other, and what actually happens when you click things. Each section names the real files, so you can open the code and follow along.

---

## 1. The big picture

Quire has **three parts**:

1. **The app in your browser** (React). Everything you see and click.
2. **Our server** (Node + Express). The "front desk". Every request for data comes here, and it decides **who is allowed to do what**.
3. **Supabase**, a hosted service that gives us two things:
   - **Auth**: it stores accounts and passwords and hands out login tokens.
   - **Postgres**: the database where documents and sharing live.

```
 Browser (React)                     Our server (Express)                Supabase
 ───────────────                     ────────────────────                ────────
 Login form ─────── email+password ─────────────────────────────────▶  Auth: "here's your token"
 Every other click ── /api/... + token ──▶  1. Is the token real?
                                           2. Is the input valid?
                                           3. Is this user allowed?  ──▶  Postgres (read/write)
                                           4. Send back the answer
```

**One rule to remember:** the browser never reads or writes the database directly. It only logs in with Supabase, and **everything else goes through our server**, which checks permissions first.

---

## 2. Where things live (folder map)

| Folder / file | What it is |
|---|---|
| `client/` | The React app (built with Vite). |
| `client/src/pages/` | The screens: `Login.jsx` (landing + sign in / sign up), `Dashboard.jsx` ("Your desk"), `EditorPage.jsx` (one document). |
| `client/src/components/` | Reusable pieces, e.g. `ShareDialog.jsx`, `Toolbar.jsx`, `DocCard.jsx`, plus folders for the landing, dashboard and editor parts. |
| `client/src/lib/api.js` | One helper every screen uses to call our server. It adds your login token and turns errors into readable messages. |
| `client/src/lib/auth.jsx` | Keeps track of who is logged in. Provides `signIn`, `signUp`, `signOut`. |
| `client/src/lib/useAutosave.js` | The autosave logic for the editor. |
| `client/src/lib/editorExtensions.js` | The list of formatting the editor supports, and the function that cleans imported files. |
| `server/app.js` | Builds the Express app and plugs in all the routes. |
| `server/routes/` | The API endpoints: `documents.js`, `shares.js`, `auth.js` (sign-up), `me.js`, `health.js`. |
| `server/middleware/requireAuth.js` | Checks the login token on every private request. |
| `server/lib/access.js` | **The permission rules.** The most important file. |
| `server/lib/validation.js` | Input rules (title length, valid email, role names…) using `zod`. |
| `server/lib/importFile.js` | Turns uploaded files into HTML. |
| `server/test/` | Automated tests. |
| `api/index.js` | One line that hands our Express app to Vercel. |
| `supabase/schema.sql` | Creates the database tables. |
| `scripts/seed.js` | Creates the demo users (Alice, Bob, Carol) and starter documents. |
| `samples/` | Example `.md`, `.txt`, `.docx` files for trying import. |

---

## 3. Logging in and signing up

### Logging in
1. You type your email and password (or click a demo chip like **Alice**) on `Login.jsx`.
2. The browser sends them **straight to Supabase Auth**, not to our server.
3. Supabase checks the password. If it's right, it sends back a **token**: a signed string that proves "this is Alice" for a while.
4. `supabase-js` stores the token in the browser and refreshes it automatically.
5. From now on, every call through `client/src/lib/api.js` attaches it as `Authorization: Bearer <token>`. `setTokenProvider` in `auth.jsx` wires this up.

**On the server**, `server/middleware/requireAuth.js` runs before any private route:
- no token → **401 "Sign in required"**
- token that Supabase doesn't recognise (fake or expired) → **401**
- valid token → it puts `req.user = { id, email }` on the request and moves on.

**If your session dies** (for example, a password reset), the next API call gets a 401. `setUnauthorizedHandler` in `auth.jsx` then signs you out locally, and you land back on the login page instead of a stuck error screen.

### Demo chips
The **Alice / Bob / Carol** buttons fill in the email and sign you in using the demo password from `VITE_DEMO_PASSWORD`. They exist so a reviewer can switch users in one click to test sharing.

### Signing up
1. You fill in **name, email, password** (8+ characters) and click **Create account**.
2. The browser calls **our** server: `POST /api/auth/signup` (`server/routes/auth.js`).
3. The server validates the input. It then asks Supabase (using the admin key) to create the account **already confirmed**, so there's no "check your email" step.
4. Inside the database, a **trigger** (an automatic rule) notices the new account and creates a matching row in `profiles` with the name and email.
5. The browser then logs in normally, as above.
6. The same email again → **409 "An account with this email already exists"**.

> Why do sign-up on the server? Supabase's normal browser sign-up sends a confirmation email, which would block reviewers. In a real product we'd keep email verification and add rate limiting. This is a deliberate demo tradeoff.

---

## 4. Who can do what (the permission system)

This is the heart of the backend. Every document has **one owner**, and other people can be given a **role**:

| Role | Read | Edit | Share | Delete |
|---|:-:|:-:|:-:|:-:|
| **Owner** | ✓ | ✓ | ✓ | ✓ |
| **Editor** | ✓ | ✓ | | |
| **Viewer** | ✓ | | | |
| *Nobody / stranger* | | | | |

All of it lives in **`server/lib/access.js`**, in three small functions:

- **`getRole(userId, doc, shares)`**: "what is this person to this document?" If they own it, they're `owner`. If there's a share row for them **on this document**, they get that role. Otherwise `null`.
- **`can(role, action)`**: looks up the table above and answers yes or no.
- **`requireDocAccess(userId, docId, action)`**: the one every route calls. It loads the document and the user's share, works out the role, and either returns the document or throws:
  - **404 "Document not found"**: the id is malformed or the document doesn't exist.
  - **403 "You don't have access"**: it exists, but you have no role.
  - **403 "As a viewer you can't write this document"**: you have a role, but not enough of one.

### Why the browser can't just go around this
- Supabase has a feature called **RLS (Row Level Security)**. We switched it **on for every table with no rules**, which means "nobody gets anything" for normal browser keys. We tested this: the browser key gets **0 rows**.
- Our server uses Supabase's **secret key**, which skips RLS. That key lives **only** in server environment variables and is never sent to the browser.
- So the only way to reach data is through our server, and our server always calls `requireDocAccess` first.

**Why not write the rules as RLS policies in SQL?** Keeping them in one JavaScript function makes them easy to read, test (every role × action is tested) and explain. It's one place to check instead of rules scattered across SQL.

---

## 5. The database

Defined in **`supabase/schema.sql`**. Three tables:

```
profiles         id, email, name            ← one row per account (made automatically on sign-up)
documents        id, owner_id, title, content, created_at, updated_at
document_shares  document_id, user_id, role ('viewer' or 'editor')
```

- **The owner is a column on the document**, not a share row. So a document can never lose its owner, and "my documents vs shared with me" is a simple split.
- **`document_shares`** has one row per (document, person). Sharing twice with the same person just **updates** their role. That's an "upsert".
- **`on delete cascade`**: deleting a document automatically deletes its shares.
- Two **triggers** (automatic database rules):
  1. When a Supabase account is created, a `profiles` row is created.
  2. When a document is updated, `updated_at` is set to now.
- **`content` is stored as JSON**, not HTML. More on that below.

---

## 6. Creating and editing a document

### Creating
1. You click **+ New document** (or the **Blank page** tile).
2. The browser sends `POST /api/documents` with an empty body.
3. The server validates it (zod rejects unknown fields, so you can't sneak in someone else's `owner_id`), inserts a row with **you** as owner, and returns it.
4. The browser opens `/d/<id>` and selects the title so you can type a name straight away.

### Opening
`EditorPage.jsx` calls `GET /api/documents/:id`. The server runs `requireDocAccess(..., 'read')` and returns the document **plus your role** and the owner's name. The page then decides:
- owner or editor → editable, with the toolbar
- viewer → read-only, with a yellow banner and no toolbar
- 403 / 404 → a friendly "This page is private" / "Document not found" sheet

### Typing and formatting
- The editor is **Tiptap**, a library built on ProseMirror. The toolbar buttons (Bold, Italic, Underline, H1, H2, lists, undo/redo) call commands like `editor.chain().focus().toggleBold().run()`.
- Internally Tiptap holds your document as a **tree** (e.g. heading → text, paragraph → bold text), and `editor.getJSON()` gives us that tree as JSON.

**Why save JSON instead of HTML?** JSON keeps the exact structure, so after a refresh the formatting comes back identical (a test checks this). There's also no raw HTML stored, so nothing dangerous to clean when loading.

### Autosave (`client/src/lib/useAutosave.js`)
1. Every change, to the title or the text, is added to a "pending changes" note.
2. The hook waits until you **stop typing for 800 ms**, then sends one `PATCH /api/documents/:id` with whatever changed.
3. The server checks you're allowed to **write**, validates the input, and saves. The database bumps `updated_at`.
4. The status pill shows **Unsaved changes → Saving… → Saved** (with a little tick).
5. **If saving fails** (say the network drops), the changes are **kept**, the pill says **Not saved**, and you get a **Retry** button. Nothing is lost.
6. Only **one save is sent at a time**. If you keep typing during a save, those changes go out right after.
7. **Ctrl/Cmd + S** saves immediately. **Leaving the page** saves, and **closing the tab** with unsaved work shows the browser's "are you sure?" warning.

### Extras on the editor page
- **Outline** (left, on wide screens): lists your headings. Click one to jump to it. The one you're reading is highlighted.
- **This document** card (right): word count, reading time (~220 words per minute), owner, your role, last edited, who has access, and **Copy link**.
- **Delete** (owner only) asks for confirmation, then `DELETE /api/documents/:id`.

---

## 7. Sharing

1. The owner clicks **Share**, which opens `ShareDialog.jsx`.
2. They type an email, pick **Can view** or **Can edit**, and click **Share**.
3. The browser sends `POST /api/documents/:id/shares` with `{ email, role }` (`server/routes/shares.js`).
4. The server:
   - validates the email and role (role must be `viewer` or `editor`, so you can't make someone "owner");
   - checks **you are allowed to share**, which means owner only;
   - looks up the email in `profiles`:
     - not found → **404 "No Quire account uses …"**
     - it's the owner's own email → **400**
   - **upserts** the share row (new person = add, existing person = change role);
   - returns the updated list of people.
5. **Changing a role** in the dropdown uses the same endpoint. **Remove** calls `DELETE /api/documents/:id/shares/:userId`.

**How the other person sees it:** when Bob opens his dashboard, `GET /api/documents` runs two queries:
- **"My documents"**: documents where `owner_id = Bob`.
- **"Shared with me"**: Bob's rows in `document_shares`, joined to the documents and their owners.

So the shared document shows up with "Alice · Viewer". When he opens it, `requireDocAccess` gives him `viewer`, so it's read-only. If Alice removes him, the share row is gone and he gets **403** next time.

---

## 8. Uploading a file: what happens, step by step

Supported: **.txt, .md, .docx**, up to **2 MB**. Each upload becomes a **new, editable document**.

### In the browser (`client/src/pages/Dashboard.jsx`)
1. You click **Import file**, or **drag a file anywhere onto the dashboard**. `useFileDrop.js` shows a "Drop to import" overlay.
2. **Quick checks first**: wrong type or over 2 MB → an error toast, and nothing is uploaded.
3. The file is put in a `FormData` and sent: `POST /api/documents/import`.

### On the server (`server/routes/documents.js` + `server/lib/importFile.js`)
4. `requireAuth` checks you're logged in.
5. **`multer`** (Express's upload helper) reads the file **into memory** (nothing is written to disk) with a hard **2 MB limit**. Bigger → **413 "File is too large"**.
6. `fileToHtml()` runs its checks and converts:
   - **Extension** must be `.txt`, `.md`, `.markdown` or `.docx`, else **415 "Unsupported file type"**.
   - **Empty file** → **400**.
   - **.docx**: it must start with the bytes **"PK"** (every .docx is really a zip file), else **400 "doesn't look like a valid .docx"**. Then **`mammoth`** converts Word → HTML, keeping headings, bold, italics and lists.
   - **.md**: decoded as UTF-8 text (not UTF-8 → **400**), then **`marked`** converts Markdown → HTML.
   - **.txt**: decoded as UTF-8, any `<` `>` are **escaped** so they show as text, blank lines become paragraphs, and single line breaks become `<br>`.
7. The server replies with `{ title, html }`. The title comes from the file name: `Q3_plan.docx` → "Q3 plan".

### Back in the browser
8. **The cleaning step.** `htmlToDoc(html)` in `client/src/lib/editorExtensions.js` runs the HTML through **the editor's own rules** (Tiptap's schema). Anything the editor doesn't support is **dropped**: `<script>`, `<img onerror=…>`, links, tables, styles. Only paragraphs, headings, lists, bold, italic and underline survive. We tested this by importing a file with a script and an image hack: they disappeared, and the formatting stayed.
9. The cleaned JSON is saved with the normal `POST /api/documents`, so an imported doc is **exactly like any other document**.
10. You get a "Imported …" toast and the editor opens on it.

> **Why split it this way?** The server does the heavy, trusted work: size limits, file checks, conversion. The editor's own rules are the safety filter, so there's **one** definition of "what a document can contain", shared by typing and importing.

---

## 9. The look and feel (UI layer)

- **Design tokens** in `client/src/styles.css`: colours (charcoal "desk", white "paper", mint, coral, sun-yellow, tan), fonts (Figtree for headings, Newsreader serif for body), shadows. Every screen uses these, so changing one colour changes it everywhere.
- **Shared motion pieces:**
  - `lib/useReveal.js`: things fade and rise in as you scroll to them (children one after another).
  - `components/Shapes.jsx`: the slowly drifting outline squares, rings and triangles.
  - `lib/toast.jsx`: small messages at the bottom ("Saved", "Shared with Bob", errors).
  - All of it is switched off if your system asks for **reduced motion**.
- **Landing / sign-in:** a scroll story. A charcoal hero with the sign-in sheet, a "good work starts on a blank page" section, then coloured panels (mint "Write & format", coral "Share with intent", grey "Bring your files", charcoal "Your desk") with animated paper mockups and a dot navigation on the right.
- **Dashboard:** a charcoal "desk" header with **Blank page** and **Import a file** tiles, a stats line, **All / Mine / Shared** tabs, **search** (press `/`), **sort**, drag-and-drop import, and paper cards coloured by role.
- **Editor:** the document sits on a stack of papers, with the floating charcoal toolbar, outline and stats rails, and a richer share dialog with role descriptions and Copy link.
- It works on phones (375 px wide): side panels hide, and the toolbar scrolls inside itself.

---

## 10. Deployment

- **Vercel** hosts everything at one URL.
  - The React app is built into static files (`npm run build` → `dist/`).
  - **`vercel.json`** says: send `/api/*` to `api/index.js`, and send every other URL to `index.html` (so refreshing `/d/123` works).
  - `api/index.js` just re-exports the same Express app from `server/app.js`.
- **The same app, three ways:** `createApp()` builds Express **without** starting it, so it's used by:
  - local dev (`server/index.js` starts it on port 4000)
  - Vercel (as a serverless function)
  - the tests (supertest calls it directly)
- **Environment variables** (set in Vercel and in `.env` locally): the Supabase URL, the publishable key (browser), the **secret key (server only)**, and the demo password.
- **Keep-alive:** Supabase's free tier pauses a project after a week with no activity. A daily Vercel cron calls `/api/health` at 09:00 UTC, which runs a real 1-row query and keeps it awake.

---

## 11. Tests (41, run with `npm test`)

| File | What it proves |
|---|---|
| `access.test.js` | Every role × every action matches the table. A share on a **different** document gives nothing. An unknown action throws instead of allowing it. |
| `importFile.test.js` | .txt/.md/.docx convert correctly (the .docx is built in memory by the test). HTML in .txt is escaped. .pdf, empty, fake-.docx and non-UTF-8 files are rejected. Upload needs a login. |
| `documents.api.test.js` | Against the **real** database, with Alice, Bob and Carol: create → format → reload gives identical content; owned/shared lists; viewer and stranger blocked; the full share lifecycle (grant → upgrade → remove); import limits (415/413); sign-up (works, gets a profile, can be shared with, duplicate → 409); can't spoof `owner_id`. |
| `app.test.js` | No token / fake token → 401, unknown route → JSON 404, broken JSON → 400, sign-up validation, database health. |

**Why test against the real database?** Because the permission path is the thing most likely to break, and mocks would only test our assumptions about it. The tests create their own data and clean up after themselves.

---

## 12. Questions you might be asked (with short answers)

**Why put permissions in Express and not Supabase RLS?**
One small, readable, fully tested function is easier to trust and explain than policies spread across SQL. RLS is still on, set to "deny everything", as a safety net so the browser can't read the tables directly.

**What happens if two people edit the same document at once?**
Last save wins. Real-time co-editing (CRDTs like Yjs) was a deliberate cut. The next step would be a version check: send `updated_at` with each save, and if the doc changed meanwhile, return 409 and ask the user to reload or overwrite.

**How is file upload made safe?**
Size and type limits on both sides, a real file-format check for .docx, UTF-8 checks, in-memory only (no files on disk), and the converted HTML goes through the editor's own schema, which drops scripts and anything else it doesn't support.

**Why store JSON instead of HTML?**
It preserves structure exactly, and there's no stored HTML that could carry a script.

**How do you stop someone making themselves the owner, or editing someone else's doc?**
The server never trusts the browser: zod rejects extra fields like `owner_id`, ownership always comes from the login token, and every route calls `requireDocAccess`. Both are covered by tests.

**Why seeded demo users if sign-up exists?**
So reviewers can test sharing between three accounts in one click, without creating and juggling accounts.

**What did you cut, and why?**
Real-time co-editing, comments and suggestions, version history, export, images and tables, email verification and password reset, and import into an existing doc. I preferred a few things that work end to end and are tested over many half-features.

**What would you build next with 2–4 more hours?**
Stale-write protection (409 + prompt), export to Markdown/PDF, version snapshots with restore, then live presence and real-time editing with Yjs + Supabase Realtime.

**How did you use AI?**
Claude Code as a pair programmer, in phases on separate branches. I chose the stack and the design direction, read the changes, and checked every phase with tests and by clicking through it. Real catches are listed in `AI_WORKFLOW.md` and `AI_LOG.md`.
