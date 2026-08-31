# FreshBuild Pro

**Design. Comply. Build.** — Pre-submission compliance intelligence for residential building permits.

A contractor designs a job, submits for the permit, and finds out weeks later the
city kicked it back over something he could have caught on day one. Plan review
only tells you what is wrong *after* you submit. FreshBuild Pro is the check that
happens before the city ever sees the plans.

You enter the job in plain fields — no CAD, no drafting. The engine checks it
against the code for that city and flags what is going to get rejected: the exact
rule, where it comes from, and how to fix it.

> Joist span of 20 ft exceeds Cincinnati's maximum allowable span of 10 ft for
> 2x8 at 16" o.c.
> *Source: City of Cincinnati "Residential Deck Drawings", Sheet 1 of 5,
> Framing / Footing Table.*
> → Reduce the span, add a beam line, or size up the joist.

Scope today: **Cincinnati, residential decks.** One city, one trade, done right.

---

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Two seeded jobs are there to start: the Willis
deck (built to code) and a Ludlow Ave. job that trips the span table.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Engine tests |
| `npm run rules:audit` | Lists sources past their re-check date and unconfirmed rules |
| `npm run lint` | ESLint |

## How it works

The engine is deterministic — the same job entered gives the same answer every
time, with no AI guessing. Each check is a plain if-this-then-that rule tied to
a specific City of Cincinnati source, and when the engine is not certain it flags
"needs confirmation" instead of making a call it cannot back up.

Four properties are enforced in code, not left to author discipline:

1. **Every rule cites a primary source.** No source, no rule.
2. **An unconfirmed rule cannot assert.** The evaluator downgrades it to
   "needs confirmation" regardless of what the rule tried to emit.
3. **An unlearned city is refused, not approximated.** No nearest-neighbor
   fallback.
4. **Every run is recorded** — which rules ran, which tripped, and when.

Full detail in [docs/ENGINE.md](docs/ENGINE.md).

### The thing generic tools get wrong

Every deck-span calculator out there asks what species your lumber is.
Cincinnati never asks — General Note 2 on the city's own drawing set already
settles it at No. 2 Southern Pine or better, so the city does not print a species
column. This app does not ask either, and the rule set says why. An off-the-shelf
tool answers a question this city does not ask, off a table that does not apply
here — so it can hand you a number that is technically fine and still gets your
permit rejected.

## Current state of the rule set

13 Cincinnati deck rules are encoded. 2 are verified against a primary source;
11 have their shape encoded and their number still to be confirmed, and report
as "needs confirmation" until then. The joist span table has 1 of 12 cells
confirmed.

That ratio is the honest state of things and the roadmap at the same time —
[docs/RULE_VERIFICATION.md](docs/RULE_VERIFICATION.md) is the working checklist.
Confirming a number is a small, mechanical change: read it off the sheet, encode
it, flip the flag, add a test.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Vitest.

Storage is a JSON file behind a `ProjectStore` interface
(`src/lib/store/`) — swap in Postgres by writing one more implementation and
changing a single export. That goes in before any contractor's data does.

## Layout

```
src/lib/engine/    Rule contracts, evaluator, jurisdiction registry
src/lib/rules/     Sources and per-city rule sets
src/lib/store/     Persistence behind an interface
src/app/           Jobs list, intake, compliance report, rule-set browser
tests/             Engine tests
docs/              Engine design, rule verification checklist
```

---

FreshBuild LLC · Cincinnati, Ohio · Veteran owned
