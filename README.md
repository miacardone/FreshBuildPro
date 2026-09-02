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
> 2x8 joists at 16" o.c.
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

### Working the table backwards

Saying a job will be rejected is half the product. The **Options** tab is the
other half: given the same Cincinnati table, the solver works backwards to every
configuration that passes, ranked by how little has to change.

A 20 ft joist run is over every single-span row in the table. The solver answers
with the routes that exist:

> **2x8 joists at 16" o.c. · multi-span** — 10 ft between supports
> (2) 2x12 beam · posts no more than 10 ft apart · 22" × 11" footings
> *Span configuration: single-span → multi-span, add an intermediate beam line*

One click adopts an option and re-runs the engine. Nothing is calculated or
estimated — joist, beam, post spacing and footing sizes travel together as one
row of the city's sheet, and if a configuration is not on that sheet it is not
offered. The tests round-trip **every** option the solver returns back through
the engine and assert it comes out clean, because a confidently wrong suggestion
would be worse than no suggestion.

The solver covers framing, footings and the ledger. Guards, stairs and the
property rules are not its remit, and it says so rather than implying it solved
them.

### Permit documents

Once the design is clean, the app builds the paperwork. Six documents, generated
from the job's own data and printable to PDF from the browser:

| Document | What it is |
|---|---|
| Permit Application Cover Sheet | Identity, scope, review path, signature blocks |
| **Deck Plan Specification** | Every numbered blank [1]–[14] on the city's five sheets, answered |
| Framing & Footing Schedule | The one table row that governs this deck |
| Site Plan Worksheet | What the city requires shown, with what's known filled in |
| Compliance Report | Every finding and confirmed check, with citations |
| Submission Checklist | The envelope, scope-driven extras, filing timing |

The Deck Plan Specification is the one that earns its keep: sheets 2–5 of the
city's set are fill-in-the-blank templates, so it answers each blank by number
and sheet, and marks the three that are choices made on the drawing itself
(beam-to-post connection, footing option, handrail grip) as *choose on the
sheet* rather than inventing an answer. Filling in the city's set becomes
transcription.

These are deliberately **not** reproductions of the city's sheets. Each says so
in its footer: contractor's worksheets that go alongside Cincinnati's own forms
— not city forms, and not approvals.

### Tier 1 same-day review

Cincinnati reviews residential decks **under 400 sq ft** the same day, first-come
first-served, 7:30 a.m. to 2:30 p.m. Over that, the job goes into the standard
queue. Every project shows which path it lands in, because the difference between
walking out with a permit and waiting weeks is worth knowing before you promise
a client a date.

### The things generic tools get wrong

Every deck-span calculator out there asks what species your lumber is.
Cincinnati never asks — General Note 2 on the city's own drawing set already
settles it at No. 2 Southern Pine or better, so the city does not print a species
column. It does not print a spacing column either: table note (a) fixes every row
at 16" o.c. maximum. This app asks for neither, and the rule set says why.

Three more places where the number that governs here is not the number a generic
tool will give you:

| | Generic / IRC | Cincinnati |
|---|---|---|
| Stair riser | 7 3/4" max | **8 1/4" max** (Sheet 3) |
| Stair tread | 10" min | **9" min** (Sheet 3) |
| Posts | often "6x6 to be safe" | **4x4 allowed to 8 ft** (General Note 17) |

And one where the generic instinct is not just wrong but expensive: a ledger on
brick veneer. The reflex is to call that unbuildable and go freestanding.
Cincinnati publishes a **Brick Veneer Applications** detail on Sheet 4 — through
bolts to the rim joist, caulk with a spacer, weep holes left clear. The app tells
the contractor which detail to draw, not to redesign a deck that was fine.

## Current state of the rule set

**31 Cincinnati rules encoded**, in two groups.

*Framing* — 23 rules, every one verified against the city's published
"Residential Deck Drawings" set: the full Framing/Footing Table (4 joist rows,
10 beam rows with their footing sizes and ledger bolt spacing), the General
Notes, and the stair, guard, ledger and bracing details on Sheets 2 through 4.
A copy of the set as transcribed is kept in [docs/sources/](docs/sources/).

*Permitting and property* — 8 rules covering the things that stop a job before
framing ever comes up: Tier 1 same-day review eligibility, historic Certificate
of Appropriateness, floodplain, and the separate electrical, plumbing and
mechanical permits a deck's scope can pull in.

Two things are deliberately left unresolved rather than guessed:

- The city's own set is ambiguous about footing dimension [D] — Sheet 1 heads
  that column "min. thick", Sheet 4 calls it the required footing *depth*. The
  engine reports the conflict instead of picking a reading.
- Zoning — setbacks, lot coverage, rear-yard encroachment — is **not** encoded.
  A deck can be framed perfectly and still be refused on placement, and the app
  says so on every job rather than letting a contractor assume otherwise.

[docs/RULE_VERIFICATION.md](docs/RULE_VERIFICATION.md) is the working checklist,
including what is still open — zoning and setbacks are not encoded at all, and
the app does not pretend otherwise.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Vitest.

**This is a demo.** There is no database. The seeded jobs come from code, and
anything you create or change in the app rides in your own cookie — so it works
across serverless instances, costs nothing, and two people demoing at once never
collide. "Reset demo" in the sidebar puts the seeded jobs back.

Storage sits behind a `ProjectStore` interface (`src/lib/store/`), so the day
real contractor data goes in, that means writing one more implementation and
changing a single export. Nothing above that layer changes.

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
