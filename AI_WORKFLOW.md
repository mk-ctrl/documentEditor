# AI workflow note

## Tools

- **Claude Code (Claude Opus 5.5)** in the Claude desktop app, as a pair programmer. It planned phases, wrote first drafts of code, ran tests and drove a browser to check the UI.
- No other code-generation tools.

## How I worked with it

- **Plan first, then phases.** We agreed a phase plan ([PLAN.md](PLAN.md)) before writing code.
- **A branch per phase** (`phase-1/auth-data` … `phase-4/upload`), merged to `main` only after tests passed and I'd checked it in the browser.
- **I set the constraints.** I rejected the AI's first stack, chose the visual direction, and kept scope cuts deliberate.
- **A running log.** [AI_LOG.md](AI_LOG.md) records, per phase, what AI produced, what was changed or rejected, and how it was verified. This note summarises it.

## Where AI materially sped things up

- **Scaffolding and boilerplate:** the Vite + Express + Vercel wiring, the zod schemas, and the CSS for the paper / desk design system.
- **Tests:** the exhaustive role × action matrix, the share-lifecycle integration test, and building a valid `.docx` in memory instead of committing a binary fixture.
- **Debugging:** probing Supabase directly to explain odd behavior (below) took minutes instead of an hour of guessing.

## What I changed or rejected

| AI output | What happened |
|---|---|
| Initial stack: Next.js + Neon + Drizzle + hand-rolled JWT auth | **Rejected.** I know React, Express and Supabase, and I must be able to explain every line. Supabase Auth also removed custom password and session code. |
| "Replicate the reference site" | **Narrowed.** We took the *design language* (dark desk, white paper sheets, sans + serif pairing, mint buttons) but not the reference's brand, photos or licensed fonts. Free lookalike fonts, and our own name and logo. |
| First logo (circle + tail) | **Rejected on visual review.** At small sizes it read as a search icon. Replaced it with a stacked-sheets mark. |
| Health check using a `head: true` count query | **Bug.** The test passed before the tables existed: a HEAD request to a missing table returns 204 with no error. Switched to a real 1-row read, and the test now fails correctly when the DB isn't set up. |
| Shared-docs query embedding `profiles` | **Bug, caught by an integration test.** Postgres had two paths from documents to profiles, so the query was ambiguous and returned a 500. Fixed by naming the foreign key. |
| Dev server reading `PORT` | **Bug, found in browser testing.** The tool environment set `PORT` for Vite too, so both servers collided (API 502). Moved the API to `API_PORT`. |
| Session handling | **Gap, found manually.** Re-seeding revokes sessions, and the UI got stuck on "session expired". Added a global 401 handler that returns to login. |
| Integration tests failing at 5 s | **Not a logic bug.** Raised the timeout instead of mocking the DB, because these tests are only valuable *because* they hit the real permission path. |

## How I verified correctness, UX and reliability

- **Automated:** 41 tests. Permission rules are unit-tested exhaustively. Sharing, persistence, validation and import limits are tested end to end against the real database with three users.
- **Manual, in a real browser, every phase:** login and wrong password, create → format → reload, owner shares → recipient sees it under "Shared with me" → viewer gets read-only, and an import containing `<script>` / `<img onerror>` comes out clean.
- **Live deploy checks after each merge:** `/api/health` reports the DB connected, protected routes return 401 without a token, and the SPA routes resolve.
- **Security review of AI code:** the secret key is server-only, RLS blocks the browser by default (verified: the publishable key returns 0 rows), the client can't set `owner_id` (strict zod, tested), and imported HTML only passes through the editor schema.
- **Honesty about limits:** known rough edges are listed in the README rather than hidden.
