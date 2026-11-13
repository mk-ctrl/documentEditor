# AI Log (running notes → source for AI_WORKFLOW.md)

Tools: Claude Code (Claude Opus 5.5) in the Claude desktop app.

| Phase | What AI produced | What was changed / rejected, and why | How it was verified |
|---|---|---|---|
| Planning | First stack proposal: Next.js App Router + Neon + Drizzle + hand-rolled JWT auth | **Rejected.** Swapped to React (Vite) + Express + Supabase because I know them and must be able to explain every line. Supabase Auth also removes hand-built password and session code. | Re-planned the phases around the familiar stack (PLAN.md). |
| Planning | Supabase setup | Kept RLS on with **no policies**, so the browser can't touch the tables. All permission logic lives in one testable Express function instead of SQL policies. | Will be covered by API tests in Phase 5. |
| 0 | Health check used `select(..., { head: true })` | **Bug caught by a suspicious green test:** the DB health test passed before the tables even existed. A direct probe showed the HEAD count query returns 204 with no error for a missing table, while a normal GET returns 404 `PGRST205`. Switched to a 1-row `select().limit(1)`. | Test now fails before the schema is applied (correct) and passes after. |
| 1 | UI direction from the reference site (curvy.dk/beagle) | Took the **design language** (charcoal desk, white paper sheets with deep shadows, bold geometric sans + light serif, mint pill buttons, outline shapes) but not its brand, photos or licensed fonts (Avenir/Kepler → free Figtree + Newsreader). Named the product "Quire". | Visual check in the browser. |
| 1 | First brand mark (circle + tail) | **Rejected on visual review:** at 26px it read as a search icon. Replaced it with a stacked-sheets mark. | Screenshot. |
| 1 | Dev server used `PORT` | **Bug found in browser testing:** the preview tool sets `PORT=5173` for the whole process, so Express bound to Vite's port and `/api/me` returned 502. Switched the API to `API_PORT`. | Network panel showed 502; after the fix, the profile loads. |
| 1 | Access rules as a pure function + full matrix test | Kept. Added a case AI didn't think of: a share row for a *different* document must not grant access. | 26 tests passing. |
