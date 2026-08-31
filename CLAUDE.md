# FreshBuild Pro — working notes

Pre-submission building-code compliance for residential permits. Cincinnati,
decks. Next.js 16 App Router, TypeScript, Tailwind 4, Vitest.

Read `docs/ENGINE.md` before touching anything under `src/lib/engine` or
`src/lib/rules`.

## Non-negotiables

These are the product, not preferences:

- **The engine is deterministic.** No model call ever produces a finding. If a
  model gets used somewhere, it is for drafting text a human reviews — never for
  a pass/fail.
- **Every rule cites a registered primary source.** `getSource` throws otherwise.
- **Never mark a rule or a span-table cell `verified` without reading the number
  off the cited document.** Not to fill out a table, not to make a demo look
  complete. A wrong number that reads as confirmed is the failure mode this
  product exists to prevent.
- **Never add a fallback jurisdiction.** An unlearned city is refused.
- **Do not add a lumber-species field.** Cincinnati settles species in General
  Note 2; asking is the mistake every generic tool makes.

## After changing rules

```bash
npm test
npm run rules:audit
```

Update `docs/RULE_VERIFICATION.md` in the same change, and bump
`CINCINNATI_DECK_RULESET_VERSION`.
