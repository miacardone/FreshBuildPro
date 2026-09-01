# The compliance engine

## What it is

A deterministic rules engine. You give it a job — plain fields, no CAD — and it
returns findings: what is wrong, why it matters, the next step, and the citation
behind it.

Same job in, same answer out. Every time. No model is involved in any finding.

## The four rules the engine itself follows

**1. Every rule cites a primary source.**
A rule with no registered source throws at lookup. Sources live in
`src/lib/rules/sources.ts` with the document title, the sheet or section, the
URL, the edition, the date a human last checked it, and how often it must be
re-checked.

**2. A rule that is not confirmed does not assert.**
Each rule carries `confidence: "verified" | "needs_confirmation"`. The evaluator
downgrades any non-info finding from an unconfirmed rule to severity `confirm`.
This is enforced in `evaluate.ts`, not left to the rule author's discipline —
so a rule cannot fail a job on a number nobody has read off the city's document.

**3. An unlearned city is an answer, not a guess.**
`getRuleSet` throws `UnsupportedJurisdictionError` for any city/trade with no
encoded rule set. There is no nearest-neighbor fallback, no "close enough"
jurisdiction. The UI shows the refusal plainly.

**4. Every run is recorded.**
An `Evaluation` carries which rules ran, which applied, which tripped, the rule
set version, and the timestamp — including the rules that passed. That is the
audit trail behind the readiness score.

## Layout

```
src/lib/engine/
  types.ts           Rule, Finding, Evaluation, DeckProject — the contracts
  evaluate.ts        The evaluator and the readiness score
  jurisdictions.ts   Which cities and trades are covered; refuses the rest
  safe.ts            Non-throwing wrapper for the UI

src/lib/rules/
  sources.ts                     Registered primary sources + re-check schedule
  cincinnati/deck-tables.ts      The city's span table, cell by cell
  cincinnati/deck.ts             The Cincinnati deck rule set
```

## Adding a rule

1. Register the source in `sources.ts` if it is not there.
2. Add the rule to the city's rule set with `confidence: "needs_confirmation"`.
3. Confirm the threshold against the document. Only then flip it to `verified`,
   set `encodedOn`, and update the source's `lastVerified`.
4. Add a test in `tests/engine.test.ts` covering both the tripping and the
   passing case.
5. Bump the rule-set version constant.

## Adding a city

Add a `Jurisdiction` entry and a `RuleSet` in `jurisdictions.ts`, pointing at a
new `src/lib/rules/<city>/` directory. The engine does not change — that is the
design. Until the rule set exists, the engine says the city is not covered and
stops.

## The solver

`src/lib/engine/solver.ts` reads the same encoded table in the other direction:
given a project, enumerate the configurations that pass and rank them by how
little changes.

It follows the engine's rules. It never proposes a span, footing or post size
that is not on the city's sheet, and it never claims to have solved a rule
outside framing. `applyOption` turns a chosen option into a new project, which
is also what the tests use — every option `solveFraming` returns is applied and
re-evaluated, and must come back with no framing blockers. That property test is
the reason to trust the feature.

`solveFraming` treats `joistSpanFt` as the clear span between supports, so a
deck already framed multi-span covers twice that. Solving on the **total run**
is what lets the solver offer "add an intermediate beam line" as a real option
rather than only offering bigger lumber.

## Readiness score

Starts at 100. Each blocker costs 25, each likely correction 10, each item to
confirm 3, each missing required field 5.

The number is a summary, not the gate. A job is never "ready" while a blocker
stands or a required field is empty, whatever the score says.
