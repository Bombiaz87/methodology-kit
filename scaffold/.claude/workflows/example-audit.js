// KIT · [Node-ref] — orchestration workflow: fan-out of a skill over a partition of files, adversarial verification, synthesis.
// Expected behavior: it is OPT-IN and EXPENSIVE (dozens of sub-agents). Only run it at the end of a sensitive intervention or on explicit request;
// the output should be PERSISTED under docs/ (e.g. docs/reviews/YYYY-MM-DD-<scope>.md), not left volatile in the chat.
//
// The functions injected by the runner (agent / pipeline / parallel / log / args) are part of the workflow's execution environment,
// and must not be imported. Adapt the paths and the SCHEMA to your stack: this file is a didactic SKELETON, not a ready-to-run executable.

// `meta` is the contract the runner reads to describe the workflow in the listing: keep it aligned with the real phases.
export const meta = {
  name: 'example-audit',
  description: 'Adversarial audit of a subset of the codebase: a review skill applied in parallel, partitioned by module.',
  phases: [
    { title: 'Review',    detail: 'N sub-agents apply the review skill to the files of their unit' },
    { title: 'Verify',    detail: 'a skeptic tries to REFUTE every finding against the real code (cuts false positives)' },
    { title: 'Synthesis', detail: 'dedup + severity promotion + final report in the skill\'s format' },
  ],
}

const ROOT = '{{REPO_PATH}}'
// The review skill is the only external dependency: the prompt tells the sub-agents to READ IT and follow it to the letter.
const SKILL = `${ROOT}/.claude/skills/<review-skill-name>/SKILL.md`

// ---- DETERMINISTIC partition of files into units ----
// The method idea: split the codebase into cohesive, known-risk units, so each sub-agent has a small,
// complete context (bugs live in the interaction between new and old: give each unit the files that talk to each other).
// Each unit carries a textual `risk`: it orients the reviewer's attention and ends up in the report.
const UNITS = [
  { name: 'critical-module',   risk: 'HIGH — external entry points / sensitive data / security invariants',
    files: ['relative/path/to/file-a.ext', 'relative/path/to/file-b.ext'] },
  { name: 'domain-logic',      risk: 'MEDIUM — pure business logic, transformations, validation schemas',
    files: ['relative/path/to/file-c.ext'] },
  { name: 'ui-or-glue',        risk: 'LOW — layout / UI glue / potentially orphaned scaffold code',
    files: ['relative/path/to/file-d.ext'] },
]

// ---- Coverage: compare the partition against the authoritative list passed in `args` ----
// So no file slips through: if the orchestrator passes the full source list, unassigned files end up in a fallback unit.
const authoritative = Array.isArray(args) ? args : []
const assigned = new Set(UNITS.flatMap((u) => u.files))
const uncovered = authoritative.filter((f) => !assigned.has(f))
if (uncovered.length) {
  log(`⚠️ ${uncovered.length} unassigned files → fallback unit: ${uncovered.join(', ')}`)
  UNITS.push({ name: 'uncovered-fallback', risk: 'fallback — files that slipped through the partition', files: uncovered })
}
log(`Audit: ${authoritative.length} files in ${UNITS.length} units.`)

// ---- STRUCTURED output schemas: force sub-agents to answer in machine-readable form, not prose ----
const REVIEW_SCHEMA = {
  type: 'object',
  required: ['unit', 'files_reviewed', 'findings', 'verified_ok', 'fragile_assumptions'],
  additionalProperties: false,
  properties: {
    unit: { type: 'string' },
    files_reviewed: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['severity', 'title', 'file', 'line', 'problem', 'impact', 'fix', 'confidence'],
        additionalProperties: false,
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'WARNING', 'NOTE'] },
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'string' },
          problem: { type: 'string' },
          impact: { type: 'string' },
          fix: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    // Defenses that HOLD: documenting them keeps the next review from re-flagging them, and gives confidence to the verdict.
    verified_ok: { type: 'array', items: { type: 'string' } },
    fragile_assumptions: { type: 'array', items: { type: 'string' } },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['verdict', 'reasoning', 'adjusted_severity'],
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'refuted', 'uncertain'] },
    reasoning: { type: 'string' },
    adjusted_severity: { type: 'string', enum: ['CRITICAL', 'WARNING', 'NOTE', ''] },
  },
}

// ---- Phase 1 prompt: review of ONE unit ----
const reviewPrompt = (u) => `You are an adversarial reviewer. You apply the review skill to ONE unit of the project.

READ FIRST (mandatory):
1. ${SKILL} — full methodology + personas. Follow it TO THE LETTER: severity, the "at least one finding per dimension" rule, no making things up.
2. ${ROOT}/CLAUDE.md — project conventions.
3. ${ROOT}/docs/architecture/code-conventions.md — boundaries between modules, data access rules.

TEST NOTE: tests live elsewhere; "missing test" is a finding ONLY for pure business logic, critical invariants and validation schemas — NEVER for pure layout or copy-pasted components.

UNIT: "${u.name}" — risk: ${u.risk}
FILES TO REVIEW (read them ALL, IN FULL — bugs live in the interaction between new and old):
${u.files.map((f) => `- ${ROOT}/${f}`).join('\n')}

For each finding: severity (CRITICAL/WARNING/NOTE) · short title · file (relative path) · line · problem (direct, ENGLISH) · impact · fix (concrete action) · confidence (use low/medium if you haven't verified at runtime).
No hedging: it's either a problem or it isn't. Also fill in verified_ok and fragile_assumptions.

Your final message IS the structured value (StructuredOutput), not prose for humans.`

// ---- Phase 2 prompt: the SKEPTIC refutes every finding (knocks down false positives) ----
const verifyPrompt = (f) => `You are an adversarial SKEPTIC. A reviewer produced this finding. Your job is to REFUTE it by reading the REAL code.
Default to "refuted" if you find no concrete proof that the problem exists and is observable/exploitable in the current code.

FINDING:
- Declared severity: ${f.severity} · Confidence: ${f.confidence}
- Title: ${f.title}
- File: ${f.file} · Line: ${f.line}
- Problem: ${f.problem}
- Impact: ${f.impact}
- Proposed fix: ${f.fix}

PROCEDURE: read ${ROOT}/${f.file} and the connected files. Ask yourself: does the defense ALREADY exist elsewhere (upstream guard, validation, data-level check)? Is the path reachable by a real attacker?
If the defense exists or the problem is not reachable → refuted. If confirmed → confirmed. If not determinable without runtime → uncertain.

Return (StructuredOutput): verdict · reasoning (ENGLISH, cite file:line as proof) · adjusted_severity (if the declared severity is wrong; otherwise "").`

// ---- Phase 1+2 pipelined: review a unit, then immediately verify its flagged findings (no global barrier) ----
const reviewed = await pipeline(
  UNITS,
  (u) => agent(reviewPrompt(u), { schema: REVIEW_SCHEMA, phase: 'Review', label: `review:${u.name}` }),
  async (res, u) => {
    if (!res) return null
    // Only CRITICAL/WARNING go through the skeptic; NOTEs stay "unverified" (cost: verifying a NOTE doesn't pay off).
    const flagged = res.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'WARNING')
    const notes = res.findings.filter((f) => f.severity === 'NOTE').map((f) => ({ ...f, verdict: 'unverified', adjusted_severity: '' }))
    if (!flagged.length) return { ...res, findings: notes }
    const verifiedFlagged = await parallel(
      flagged.map((f) => () =>
        agent(verifyPrompt(f), { schema: VERDICT_SCHEMA, phase: 'Verify', label: `verify:${u.name}` })
          .then((v) => ({ ...f, verdict: v ? v.verdict : 'uncertain', verdict_reason: v ? v.reasoning : 'verification failed', adjusted_severity: v ? v.adjusted_severity : '' })),
      ),
    )
    return { ...res, findings: [...verifiedFlagged.filter(Boolean), ...notes] }
  },
)

const units = reviewed.filter(Boolean)
const allFindings = units.flatMap((u) => u.findings.map((f) => ({ ...f, unit: u.unit })))
// Apply the skeptic's severity correction, then discard the refuted ones.
allFindings.forEach((f) => { if (f.adjusted_severity) f.severity = f.adjusted_severity })
const surviving = allFindings.filter((f) => f.verdict !== 'refuted')
const refutedCount = allFindings.filter((f) => f.verdict === 'refuted').length

log(`Review complete: ${units.length} units, ${surviving.length} surviving findings (${refutedCount} refuted and dropped). Synthesizing…`)

// ---- Phase 3: synthesis in the skill's exact format (dedup + severity promotion) ----
const synthData = JSON.stringify({ surviving, refutedCount, unitsReviewed: units.map((u) => u.unit), totalFiles: authoritative.length }, null, 1)
const synthPrompt = `You are the final SYNTHESIZER of an adversarial review (${authoritative.length} files, ${units.length} units).
The findings have already gone through verification: the "refuted" ones are removed.

READ ${SKILL} section "Output format" and FOLLOW IT EXACTLY.

SYNTHESIS RULES:
- DEDUPLICATE identical findings (same file+problem) caught by different units: merge them.
- PROMOTE by one level the severity of every finding caught by 2+ distinct dimensions (NOTE→WARNING, WARNING→CRITICAL) and say so explicitly.
- Verdict: BLOCK if ≥1 CRITICAL; CONCERNS if 0 CRITICAL but ≥2 WARNING; CLEAN if only NOTEs.
- Include "uncertain" findings marking them "(needs runtime verification)".
- Add an "In plain language" section readable by a PM, with every metaphor anchored inline to the real technical referent.
- Output = ONLY the markdown of the report.

DATA (JSON):
${synthData}`

const report = await agent(synthPrompt, { phase: 'Synthesis', label: 'synthesis-report' })

return {
  report,
  stats: {
    filesAudited: authoritative.length,
    units: units.length,
    survivingFindings: surviving.length,
    refutedAndDropped: refutedCount,
    bySeverity: {
      CRITICAL: surviving.filter((f) => f.severity === 'CRITICAL').length,
      WARNING: surviving.filter((f) => f.severity === 'WARNING').length,
      NOTE: surviving.filter((f) => f.severity === 'NOTE').length,
    },
  },
}
