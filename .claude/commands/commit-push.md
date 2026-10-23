---
description: Group the working tree into per-feature commits, push the current branch, and open a PR against main with a summarised title and body.
allowed-tools: Bash(git:*), Bash(gh:*)
argument-hint: [none — base branch is always main]
---

# Commit, push, open the PR

## Pre-injected context

Current branch:
!`git rev-parse --abbrev-ref HEAD`

Working tree status:
!`git status --short`

Commits on this branch vs `main`:
!`git fetch origin main --quiet 2>/dev/null; git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -10`

Diff vs `main` (stat, the basis for the PR body):
!`git diff --stat origin/main...HEAD 2>/dev/null`

Existing PR for this branch:
!`gh pr view --json url,state,baseRefName --jq '"\(.state) → \(.baseRefName): \(.url)"' 2>/dev/null || echo "none"`

## Phase 1 — Commit

1. **Branch guard.** If the current branch is `main`, abort and tell the user to branch first. Never commit on `main`.
2. **Gates first.** Run `pnpm typecheck` and `pnpm test`. If either fails, stop: do not commit a red tree.
3. **Group by change.** Analyse every changed file and group logically: the fix and its test together, the ticket status change on its own, docs last.
4. **Message format.** `fix: <description>` or `feat: <description>`, first line at most 72 characters, a blank line and a short body when it helps. Reference the ticket as `(ticket #<id>)`.
5. Stage only that group's files (never `git add -A`). No empty commits.
6. Verify with `git log --oneline` and `git status --short`.

## Phase 2 — Push

`git push -u origin HEAD`.

## Phase 3 — Open the PR (base = `main`)

If a PR already exists for this branch, do not create a duplicate; the push updated it. Otherwise:

```bash
gh pr create --base main --head "<branch>" --title "<title>" --body "<body>"
```

- **Title:** one conventional-commit line summarising the whole branch.
- **Body:**

  ```
  ## Ticket
  - tickets/<file>.md — <title>

  ## Summary
  - what changed and why, 1–3 bullets

  ## Root cause
  - file:line, one sentence

  ## Test plan
  - the test added and its red → green evidence
  - pasted output of pnpm typecheck and pnpm test
  ```

Print the PR URL at the end, and set the ticket's `status: fixed` with the PR link in a final commit.

## Hard limits

- Base is always `main`.
- Never use `--force`, `--no-verify` or `--amend`.
- Never commit `.env*` files, credentials or large binaries; warn instead.
- Never claim the gates passed without their pasted output.
