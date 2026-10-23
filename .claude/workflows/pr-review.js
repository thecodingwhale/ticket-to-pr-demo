// Adversarial PR review: review lenses fan out, then every finding is handed to
// independent refuters whose job is to kill it. Only survivors are returned.
//
// Called by /pr-review (see .claude/commands/pr-review.md) with:
//   args = { repo, prNumber, diffPath, changedFiles, lenses, existingComments, refuters }
//   lenses = [{ key: 'correctness', prompt: '...' }, ...]

export const meta = {
  name: 'pr-review',
  description: 'Review a PR across lenses, then adversarially refute every finding',
  phases: [
    { title: 'Review', detail: 'one agent per lens over the PR diff' },
    { title: 'Verify', detail: 'independent refuters per finding' },
  ],
}

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'kind', 'file', 'line', 'summary', 'failure_scenario', 'suggested_fix'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'important', 'suggestion'] },
          kind: { type: 'string', enum: ['correctness', 'security', 'convention', 'test-coverage'] },
          file: { type: 'string', description: 'repo-relative path' },
          line: { type: 'number', description: 'line in the NEW file, as it appears in the diff' },
          summary: { type: 'string', description: 'one sentence stating the defect' },
          failure_scenario: { type: 'string', description: 'concrete inputs/state -> wrong output. "unclear" is not acceptable.' },
          suggested_fix: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: {
    refuted: { type: 'boolean' },
    reason: { type: 'string', description: 'why it does or does not hold, citing code you actually read' },
  },
}

const RANK = { suggestion: 0, important: 1, critical: 2 }

// Workflow args can arrive as a JSON string; normalize before destructuring.
const input = typeof args === 'string' ? JSON.parse(args) : args
const { repo, prNumber, diffPath, changedFiles, lenses, existingComments, refuters = 2 } = input

const CONTEXT = `
PR #${prNumber} in ${repo}. The full diff is at ${diffPath} — read it with Read/Bash.
Changed files:
${changedFiles}
Open the changed files in the repo for surrounding context. Review ONLY lines this PR
adds or changes; pre-existing issues in untouched code are out of scope.
Every finding needs a concrete failure scenario. If you cannot state one, it is not a
finding — drop it. Returning zero findings is a valid and common result.
`

const ANGLES = [
  'Read the actual code at that location. Does the cited code even do what the finding claims? Check for a guard, early return, type constraint, or caller-side check that already prevents this.',
  'Try to make the failure scenario actually happen. Walk the concrete inputs through the real code path. If it cannot reach that state, the finding is refuted.',
  'Is this already known or handled? Check the existing PR comments below, and check whether the diff itself addresses it elsewhere.',
].slice(0, refuters)

phase('Review')
const reviewed = await pipeline(
  lenses,
  (lens) =>
    agent(`${lens.prompt}\n${CONTEXT}`, {
      label: `review:${lens.key}`,
      phase: 'Review',
      schema: FINDINGS,
    }),

  // Each lens's findings go straight into refutation — no barrier, so lens B is
  // still reading while lens A's findings are already being torn apart.
  (result, lens) =>
    parallel((result?.findings ?? []).map((f) => () =>
      parallel(ANGLES.map((angle) => () =>
        agent(
          `You are refuting a code-review finding. Your job is to KILL it. ` +
          `Default to refuted:true when uncertain — an unrefuted finding gets posted publicly, ` +
          `so the cost of a false finding is much higher than the cost of a missed one.\n\n` +
          `FINDING (${f.severity}/${f.kind}) at ${f.file}:${f.line}\n` +
          `  ${f.summary}\n  Claimed failure: ${f.failure_scenario}\n\n` +
          `YOUR ANGLE: ${angle}\n\n` +
          `Existing comments already on this PR (a finding that duplicates one of these is refuted):\n` +
          `${existingComments || '(none)'}\n${CONTEXT}`,
          { label: `refute:${f.file.split('/').pop()}:${f.line}`, phase: 'Verify', schema: VERDICT }
        )
      )).then((votes) => {
        const v = votes.filter(Boolean)
        const kills = v.filter((x) => x.refuted).length
        // Strict gate: with 1 or 2 refuters a single kill drops it; with 3, majority rules.
        const survives = refuters >= 3 ? kills < 2 : kills === 0
        return { ...f, lens: lens.key, survives, kills, refuters: v.length, rebuttals: v.map((x) => x.reason) }
      })
    ))
)

const all = reviewed.flat().filter(Boolean)

// Dedupe survivors across lenses on file:line — two lenses finding the same thing is one finding.
const byLoc = new Map()
for (const f of all.filter((x) => x.survives)) {
  const k = `${f.file}:${f.line}`
  const prev = byLoc.get(k)
  if (!prev) byLoc.set(k, f)
  else if (RANK[f.severity] > RANK[prev.severity]) byLoc.set(k, { ...f, lens: `${prev.lens}+${f.lens}` })
}
const confirmed = [...byLoc.values()].sort((a, b) => RANK[b.severity] - RANK[a.severity])
const dropped = all.filter((x) => !x.survives)

log(`${all.length} raised -> ${confirmed.length} survived refutation, ${dropped.length} killed`)
return { confirmed, dropped }
