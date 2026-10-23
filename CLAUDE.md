# CLAUDE.md

Guidance for Claude Code working in this repository. The commands under `.claude/commands/` are the process; this file is the project context that overrides their generic defaults. Read it before touching anything.

## What this is

A small multi-tenant invoicing domain (shops create invoices for their customers) used to demonstrate a ticket-to-PR pipeline. The app is deliberately tiny; the point is the process around it. In production the same pipeline runs on a Next.js and Postgres monorepo; here the database is an in-memory `Store` so everything runs with `pnpm test`.

## Commands

```bash
pnpm install
pnpm typecheck          # tsc --noEmit
pnpm test               # vitest, every layer
pnpm test:coverage      # v8 coverage with the thresholds in vitest.config.ts
```

## Layout

```
src/db/store.ts         in-memory store with the production shape (tenants, invoices)
src/auth/authorize.ts   authorizeAction(session, roles, { intent }) — every action's first call
src/lib/money.ts        integer-cent arithmetic
src/schemas/*.ts        zod schemas: the single source of validation messages
src/actions/*.ts        the "server actions": validate, authorize, compute, persist
tickets/NNN-slug.md     bug and enhancement tickets with frontmatter
.claude/commands/       /bugfix, /commit-push, /pr-review
.claude/workflows/      the adversarial review workflow script
```

## Conventions (the rules a generic reviewer cannot know)

- **Money is integer cents.** Percentages are rounded once, half up, at the level the user sees. Floats never reach the store.
- **Every action takes a `Session` first** and its first statement is `authorizeAction(...)`. Read-only actions pass `{ intent: "read" }`; a suspended tenant is read-only.
- **Every store read is scoped by `session.tenantId`.** An id that belongs to another tenant behaves exactly like an id that does not exist. Never return a row to a caller whose tenant does not own it.
- **Actions return `ActionResult<T>`** for user-facing problems (validation, not found) and throw only for authorization failures.
- **Tickets** live in `tickets/NNN-slug.md`. `status` moves `open` → `in-progress` → `fixed`. The fixing PR is linked in the ticket when it opens.
- **Base branch is `main`.** Work on `fix/<slug>-<id>` or `feat/<slug>-<id>`. Never commit on `main`.

## Definition of Done

Every PR ships the matching test layer. Reviewers tick each row.

| New or changed code         | Required test                                                             | Where                                       |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| Action in `src/actions/`    | Integration test against a fresh `Store` (`resetStore()` in `beforeEach`) | `src/actions/<action>.integration.test.ts`  |
| Schema in `src/schemas/`    | Unit test: the valid case plus each failure mode                          | `src/schemas/<schema>.test.ts`              |
| Pure utility in `src/lib/`  | Unit test next to source; a property test for arithmetic                  | `src/lib/<util>.test.ts`                    |
| Authorization rule          | Unit test for each role × intent the change affects                       | `src/auth/*.test.ts`                        |

Exceptions, to be named in the PR description: a typo or docs fix, a dependency bump, code deleted in the same PR.

**Prove-It:** a bug fix ships with a test that fails on the old behaviour and passes on the fix, at the closest layer that reproduces it.

## Gates

`pnpm typecheck` and `pnpm test` must be green before a commit, and their real output is pasted into the PR. Never claim green without it. Coverage thresholds live in `vitest.config.ts` and ratchet by +2 on each PR that lifts coverage.
