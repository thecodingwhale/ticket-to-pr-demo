# Ticket-to-PR demo

A working demo of the agent pipeline I use to turn a bug ticket into a reviewed pull request, with every review finding forced to survive an attempt to disprove it before it is posted.

The production version runs daily on a private multi-tenant SaaS monorepo (Next.js, Postgres with row-level security, a few thousand tests). This repository keeps the process and swaps the product for a toy invoicing domain small enough to read in ten minutes.

## The pipeline

```
ticket ─► /bugfix ─────────────────────► /commit-push ─► /pr-review ─────────────────────► human merge
          branch off main                per-feature       lenses fan out in parallel
          reproduce, localize to file:line commits,         ─► every finding gets 2–3 refuters
          minimal fix                    push, open PR      ─► majority refute = finding dies
          Prove-It test (red → green)                       ─► survivors posted inline
          typecheck + tests, output pasted                     + a "## 🤖 Code Review" ledger
          simplify only what was touched
```

Three rules do most of the work:

1. **Branch, don't commit.** The fixing agent leaves the tree for a human or `/commit-push`; nothing merges without a person.
2. **Never claim green without evidence.** Gate output is pasted, not summarised. If the gates will not go green, the agent stops and says so instead of committing.
3. **A finding that has not survived refutation is never posted.** A confident wrong review comment is worse than no comment, so refuters default to "refuted" when unsure.

## Try it

```bash
pnpm install
pnpm typecheck && pnpm test     # green on main, on purpose
```

Then, in Claude Code from the repository root:

```
/bugfix tickets/001-discount-short-by-a-cent.md
/commit-push
/pr-review <PR number>
```

`tickets/` holds two seeded bugs. Both are real defects in `src/`, both are uncovered by the current tests (that is why `main` is green), and both have a ticket written the way a QA engineer writes one: expected, actual, steps, notes. Ticket 001 is an arithmetic bug; ticket 002 is a tenant-isolation bug that the conventions lens should catch even if the correctness lens misses it.

## What is in the box

| Path                              | What it is                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                       | The project constitution: conventions, Definition of Done, gates. Every command reads it first. |
| `.claude/commands/bugfix.md`      | Ticket → root cause → minimal fix → Prove-It test → simplify. Branches, never commits.      |
| `.claude/commands/commit-push.md` | Per-feature commits, push, PR against `main` with a summarised body.                        |
| `.claude/commands/pr-review.md`   | Proportional review lenses, the refutation gate, inline comments, the ledger.              |
| `.claude/workflows/pr-review.js`  | The orchestration script: review lenses → refuters → survivors, with the kill rule.         |
| `docs/sample-review-comment.md`   | What a posted review looks like, including the `N raised → M confirmed → K killed` line.    |
| `src/`                            | The toy domain: store, authorization, money, schemas, actions, and their tests.             |
| `tickets/`                        | Two seeded bugs to run through the pipeline.                                                |

## What the production version adds

- Tickets come from a tracker through its API, and the agent's only write there is the status change.
- Integration tests run against a real local Postgres with every migration applied; row-level security is part of what they test.
- A visual check in a browser on the local stack, signed in as the role the ticket names, before the PR opens.
- A separate loop that turns a user-acceptance spreadsheet into one Playwright test per row.
- Nightly mutation testing to find tests that would not notice a broken line.

None of that is needed to see the shape of the process, which is what this repository is for.
