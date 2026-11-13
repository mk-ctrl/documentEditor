# AI Log (running notes → source for AI_WORKFLOW.md)

Tools: Claude Code (Claude Opus 5.5) in the Claude desktop app.

| Phase | What AI produced | What was changed / rejected, and why | How it was verified |
|---|---|---|---|
| Planning | First stack proposal: Next.js App Router + Neon + Drizzle + hand-rolled JWT auth | **Rejected.** Swapped to React (Vite) + Express + Supabase because I know them and must be able to explain every line. Supabase Auth also removes hand-built password and session code. | Re-planned the phases around the familiar stack (PLAN.md). |
| Planning | Supabase setup | Kept RLS on with **no policies**, so the browser can't touch the tables. All permission logic lives in one testable Express function instead of SQL policies. | Will be covered by API tests in Phase 5. |
| 0 | Health check used `select(..., { head: true })` | **Bug caught by a suspicious green test:** the DB health test passed before the tables even existed. A direct probe showed the HEAD count query returns 204 with no error for a missing table, while a normal GET returns 404 `PGRST205`. Switched to a 1-row `select().limit(1)`. | Test now fails before the schema is applied (correct) and passes after. |
