# Submission: Mirun Kaushik, Ajaia AI-Native Full Stack Assignment

## Links

- **Live app:** https://documenteditor-ivory.vercel.app
- **Source:** https://github.com/mk-ctrl/documentEditor (also included in this folder)
- **Walkthrough video:** see [`VIDEO_URL.txt`](VIDEO_URL.txt)

## Test accounts

On the login page, click a name to sign in instantly.

| User | Email | Password |
|---|---|---|
| Alice Park | `alice@example.com` | `<DEMO PASSWORD>` |
| Bob Rivera | `bob@example.com` | same |
| Carol Singh | `carol@example.com` | same |

Pre-shared: "Welcome to Quire" (Alice → Bob as viewer) and "Q3 planning notes" (Bob → Alice as editor).

## What's included

| Item | Location |
|---|---|
| Source code | this folder (`client/`, `server/`, `api/`, `supabase/`, `scripts/`) |
| Setup and run instructions | [`README.md`](README.md) |
| Architecture note | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| AI workflow note | [`AI_WORKFLOW.md`](AI_WORKFLOW.md), with the detailed per-phase log in [`AI_LOG.md`](AI_LOG.md) |
| Build plan and timeline | [`PLAN.md`](PLAN.md) |
| Database schema | [`supabase/schema.sql`](supabase/schema.sql) |
| Automated tests (39) | `server/test/` (run `npm test`) |
| Sample files for the import feature | [`samples/`](samples/) (`.md`, `.txt`, `.docx`) |
| Walkthrough video link | [`VIDEO_URL.txt`](VIDEO_URL.txt) |

## Status

**Working end to end:**
- Create, rename, edit, delete and reopen documents.
- Rich text: B / I / U, H1 / H2, lists.
- Autosave with status.
- Owner vs shared views.
- Share by email as viewer or editor, change role, revoke, all enforced on the server.
- Import of `.txt`, `.md` and `.docx` (≤ 2 MB) as new documents.
- Postgres persistence, validation and error states, tests, and the Vercel deployment.

**Intentionally not built:**
- Real-time co-editing.
- Sign-up.
- Comments, version history and export.
- Import into an existing document.

**Known rough edges:**
- Concurrent edits are last-write-wins.
- The collaborator avatar row may omit the viewer's own avatar. It's cosmetic only.

**Next 2–4 hours:**
1. Stale-write protection (`updated_at` check, 409 + prompt).
2. Export to Markdown / PDF.
3. Version snapshots with restore.
4. Real-time presence and editing (Yjs + Supabase Realtime).
