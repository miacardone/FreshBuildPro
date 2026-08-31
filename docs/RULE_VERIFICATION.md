# Rule verification checklist

Working list of what is confirmed against a primary source and what is not.
This file and the `confidence` flags in the rule set must agree.

**The discipline:** never mark something verified to make the app look more
complete. A wrong number that reads as confirmed is the one failure this
product cannot have — it is the exact thing the contractor is paying to avoid.

## Confirmed

| Item | Value | Source | Confirmed |
|---|---|---|---|
| Joist span, 2x8 @ 16" o.c. | 10 ft max | Residential Deck Drawings, Sheet 1 of 5, Framing / Footing Table | 2026-08-31 |
| Lumber species | No. 2 Southern Pine or better | Residential Deck Drawings, General Note 2 | 2026-08-31 |

## Open — shape encoded, number not yet read off the source

Each of these runs today and reports as "needs confirmation". Confirm the
number, encode it, flip `confidence` to `verified`, and move the row up.

- [ ] Joist span — remaining 10 cells of the table (`deck-tables.ts`)
- [ ] Beam span table (`cin-deck-beam-span`)
- [ ] Ledger detail at brick veneer (`cin-deck-ledger-brick-veneer`)
- [ ] Ledger detail at stucco (same rule)
- [ ] Freestanding lateral detail (`cin-deck-freestanding-noted`)
- [ ] Corner bracing requirement and trigger height (`cin-deck-corner-bracing`)
- [ ] Post size vs. deck height (`cin-deck-post-size`)
- [ ] Footing depth / frost depth (`cin-deck-footing-depth`)
- [ ] Footing diameter vs. tributary area (`cin-deck-footing-diameter`)
- [ ] Guard trigger height and minimum guard height (`cin-deck-guard-required`)
- [ ] Guard opening limit (`cin-deck-guard-opening`)
- [ ] Stair riser and tread limits (`cin-deck-stair-geometry`)
- [ ] Handrail trigger and height (`cin-deck-stair-handrail`)

## Source metadata still to fill in

- [ ] Revision date printed on the Residential Deck Drawings sheet
- [ ] Direct URL to the deck drawing set PDF (currently the permits index page)
- [ ] Adopted edition of the Residential Code of Ohio, and section per rule

## Schedule

`npm run rules:audit` lists any source past its re-check date.
