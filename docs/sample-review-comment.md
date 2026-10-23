# Sample review comment

This is what `/pr-review` posts on a pull request after the refutation gate. It is an illustrative example for a hypothetical PR fixing ticket 001; the numbers are made up to show the format, and the first line is a stable, greppable contract so other tools can find the comment.

---

## 🤖 Code Review

**Verdict:** Approve with one change requested.

**What's solid:** The fix moves the discount to the subtotal and rounds once, which matches the convention in `CLAUDE.md`. The new integration test reproduces the three-line case from the ticket and was shown red before the change and green after.

**Refutation ledger:** 4 raised → 1 confirmed → 3 killed

- killed: "`percentOfCents` can return a negative value" — the caller validates `discountPercent` through the schema; the range check in `money.ts` also throws. Unreachable.
- killed: "Missing test for a 0% discount" — `create-invoice.integration.test.ts` already covers it through the schema default.
- killed: "Line totals should also carry the discount share" — not in scope of the ticket and not a convention; a suggestion at most.

**Confirmed**

1. **important** — `src/actions/create-invoice.ts:24` The comment above the discount line still says the discount is applied per line. Comment rot.
   Fix: update the comment to describe the subtotal rounding, or delete it.
