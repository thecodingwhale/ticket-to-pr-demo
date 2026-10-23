---
description: Fix a ticket end-to-end — branch off main, mark the ticket in progress, find the root cause, implement the minimal fix, add the matching test layer, then simplify.
argument-hint: "<tickets/NNN-slug.md>"
---

# Bugfix from a ticket

Take the ticket at `$ARGUMENTS` and resolve it: reproduce the reported issue, find the real root cause in this repository, implement a fix, prove it with the right test layer, and simplify the result. Apply `CLAUDE.md` throughout; it overrides any generic default below.

## Guardrails (non-negotiable)

- **Ticket: status-only write.** Read the whole ticket (frontmatter, expected vs actual, steps, notes). The only edit to the ticket in this command is `status: in-progress`.
- **Git: branch, don't commit.** Before any investigation or edit, cut `fix/<slug>-<id>` off `main`. Do not stage, commit or push. Leave the working tree on the new branch for a human, or `/commit-push`, to review.
- **Investigate, then proceed.** Do the investigation, state the root cause and the planned fix inline, then implement. No hard stop for approval, but no silent guessing either: if the root cause is still ambiguous after investigation, or the ticket contradicts the code, stop and surface it.
- **Scope discipline.** Fix the reported bug and its direct root cause only. Do not refactor adjacent code, rename things or add unrequested behaviour. Simplification in Phase 4 is limited to code you touched.
- **Never claim green without evidence.** Paste the real output of `pnpm typecheck` and `pnpm test`.

## Phase 0 — Read, branch, mark

1. Read the ticket. Restate in your own words: expected vs actual, steps to reproduce, affected area, severity.
2. Get onto a fresh branch before anything else:
   ```bash
   git checkout main && git pull --ff-only && git checkout -b fix/<slug>-<id>
   ```
   `<id>` is the frontmatter `id` (zero-padded to three digits); `<slug>` is a short kebab-case form of the title.
3. Set `status: in-progress` in the ticket's frontmatter. Touch nothing else in the file.
4. Write a 3–6 line Issue Summary: what is broken, where, and the user-visible impact.

## Phase 1 — Reproduce and localize

1. Map the ticket to the code: actions in `src/actions/`, authorization in `src/auth/`, arithmetic in `src/lib/`, validation in `src/schemas/`, persistence in `src/db/`.
2. Trace the full path the ticket describes: input → validation → computation → store → read. Data bugs usually break at one hand-off.
3. Reproduce it with a throwaway test or script before changing anything. If it will not reproduce, say so and stop.
4. Localize the root cause to specific lines and state it: "Root cause: `<file>:<line>` does X but should do Y." If the ticket says the bug shows in several places, confirm whether they share the cause.

## Phase 2 — Plan and implement the fix

1. State the planned change and why it addresses the cause rather than the symptom. Prefer the boring, minimal change, made once at the shared source.
2. Implement it, matching the surrounding code and the conventions in `CLAUDE.md` (integer cents, `authorizeAction` first, tenant-scoped reads, `ActionResult` for user errors).

## Phase 3 — Prove it (Prove-It pattern)

Add the test layer the change requires, per the Definition of Done in `CLAUDE.md`. The test must fail on the old behaviour and pass on the fix. Run it red first, then green, and paste both runs.

| What you changed    | Required layer                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Action              | Integration test against a fresh `Store` (`resetStore()` in `beforeEach`) |
| Schema              | Unit test: valid case + each failure mode                             |
| Pure utility        | Unit test next to source; property test for arithmetic                |
| Authorization rule  | Unit test per role × intent affected                                  |

Default to the closest layer that reproduces the bug. Then run `pnpm typecheck` and `pnpm test` and paste the output.

## Phase 4 — Simplify

Only the code you touched: remove dead branches, prefer the simpler expression, keep names consistent with their neighbours. Re-run the gates.

## Output

Root cause (`file:line`), the fix, the tests added with their red → green evidence, the gate output, and anything out of scope you noticed but deliberately did not touch.
