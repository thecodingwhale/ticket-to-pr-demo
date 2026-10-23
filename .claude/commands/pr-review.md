---
description: Review a PR — fan out proportional review lenses, adversarially refute every finding, post only the survivors as inline comments plus a ledger.
argument-hint: "<PR number or URL> [--review-only | --comment-only] [--effort low|medium|high]"
---

# PR review — find, refute, post

Target: **$ARGUMENTS**

Fan out proportional review lenses, **adversarially refute every finding before it leaves this machine**, and post only what survives: inline comments anchored to the diff plus a machine-readable summary.

The governing rule: **a finding that has not survived refutation is never posted.** This writes under the user's name on a PR. A confident-sounding wrong comment is worse than no comment. Manufacture no nits.

## Phase 0 — Resolve

1. Parse `$ARGUMENTS`: a PR number, `#n`, or a `.../pull/<n>` URL. Flags:
   - `--review-only`: stop after the chat report (no comments, no edits).
   - `--comment-only`: post comments, do not edit code (how a loop would call this).
   - `--effort <low|medium|high>`: overrides the refuter count derived in Phase 1.
   Default = review → report → comment. This command **never edits code or pushes**; fixing is the caller's job.
2. `gh pr view <n> --json number,title,body,headRefName,baseRefName,url,additions,deletions,files,state` and the head SHA (`--json headRefOid`).
3. Read the existing review comments (`gh api repos/<owner>/<repo>/pulls/<n>/comments`). A re-run must not repost what is already there; the list also feeds the refuters.
4. Read `CLAUDE.md`. It is the rubric for the conventions lens and the source of the real gate commands.
5. Save the diff to a file so agents read it instead of you carrying it in context: `gh pr diff <n> > "$SCRATCH/pr-<n>.diff"`.

## Phase 1 — Choose lenses (proportional)

Always run **correctness** and **conventions**. Add more only when the diff earns it. Say which ran and why.

| Lens          | When it fires                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| correctness   | Always. Real bugs the diff introduces: logic, edge cases, wrong data in the save or read path.                  |
| conventions   | Always. The `CLAUDE.md` invariants: integer cents, `authorizeAction` first, tenant-scoped reads, Definition of Done layer present and genuine. |
| security      | The diff touches `src/auth/`, an action's authorization call, or any store read.                                 |
| test-coverage | The diff adds behaviour without the Definition-of-Done layer, or a test that cannot fail.                        |

**Effort → refuters per finding:** trivial diff (≤2 files, localized) → 1 refuter, and say you downgraded; normal → 2; `high` → 3, kill on majority. Do not spawn a full fan-out at a one-line change.

## Phase 2 — Review (fan out)

Run the workflow in `.claude/workflows/pr-review.js` with the `Workflow` tool (`scriptPath`), passing as `args`: `repo`, `prNumber`, `diffPath`, `changedFiles`, the chosen `lenses` (each `{ key, prompt }`), `existingComments` and `refuters`. Each lens prompt tells the reviewer to report only concrete, grounded findings: severity, `file:line`, and a failure scenario (inputs → wrong result). No style nits, no "missing tests" when tests are included, no hypotheticals it cannot ground in the code.

You are the orchestrator. **Do not form findings of your own here.**

## Phase 3 — Refute (hard gate)

The workflow spawns the Phase-1 number of independent refuters per finding, each with one angle:

1. Read the actual code at that location. Is there a guard, early return, type constraint or caller-side check that already prevents this?
2. Try to make the failure scenario happen. Walk the concrete inputs through the real path. If the state cannot be reached, the finding is refuted.
3. Is it already known or handled: an existing PR comment, or addressed elsewhere in the diff?

Refuters default to `refuted: true` when uncertain. With two refuters a single kill drops the finding; with three, majority rules. **Only survivors proceed. Never upgrade or re-add a killed finding.**

## Phase 4 — Report

1. `ReportFindings` with the survivors, most severe first. An empty list is a fine, honest result.
2. In chat: the **verdict** (Approve / Approve with nits / Changes requested), a short **what's solid** note, and the **refutation ledger**: `N raised → M confirmed → K killed`, naming each kill in one line. That transparency is what makes the survivors credible.

If `--review-only`, stop here.

## Phase 5 — Post

**a. Inline comments**, one per survivor whose line sits in a diff hunk:

````
gh api repos/<owner>/<repo>/pulls/<n>/comments \
  -f body='**<severity>** — <title>

<the problem>

Suggested fix:
```suggestion
<code>
```' \
  -f commit_id='<head sha>' -f path='<file>' -F line=<line> -f side=RIGHT
````

If a survivor's line is not in a diff hunk, name `file:line` in the summary instead and say so.

**b. Summary comment** (`gh pr comment <n> --body '...'`). The first line must be `## 🤖 Code Review` (a stable, greppable contract), then the verdict, what's solid, the ledger, and each survivor with a `Fix:` line. With zero survivors, post one short approving comment in the same format. Do not manufacture nits to look useful.

## Constraints

- **Refutation is a hard gate.** When in doubt, the finding dies.
- **Never edit code, never push, never merge.** Review and comment only.
- **Gates are the repo's own:** `pnpm typecheck`, `pnpm test`. When validating a suggested fix, paste real output; never claim green without it.
- **Fan-out is proportional.** Synthesize only from real agent output. If a lens was skipped or a comment could not be anchored, say so.
