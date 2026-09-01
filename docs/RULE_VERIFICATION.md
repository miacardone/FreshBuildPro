# Rule verification checklist

What is confirmed against a primary source and what is not. This file and the
`confidence` flags in the rule set must agree.

**The discipline:** never mark something verified to make the app look more
complete. A wrong number that reads as confirmed is the one failure this product
cannot have — it is the exact thing the contractor is paying to avoid.

Source of record: City of Cincinnati, "Residential Deck Drawings", 5 sheets.
A copy as transcribed is kept at
[`cincinnati-residential-deck-drawings.pdf`](sources/cincinnati-residential-deck-drawings.pdf)
so a rule can be checked against exactly what was read, not against whatever is
at the URL today.

## Confirmed against the city's sheets — 2026-08-31

### Sheet 1 — Framing/Footing Table and General Notes

| Item | Value | Locator |
|---|---|---|
| Joist span, 2x6 | 8 ft | Framing/Footing Table, col [A] |
| Joist span, 2x8 | 10 ft | " |
| Joist span, 2x10 | 13 ft | " |
| Joist span, 2x12 | 16 ft | " |
| Joist spacing | 16" o.c. max, all rows | Table note (a) |
| Beam spans, footing sizes, ledger bolt spacing | 10 rows | Table cols [B][C][D] |
| Lumber species | No. 2 Southern Pine, or better | General Note 2 |
| Guard required above | 30" above grade | General Note 5 |
| Guard height | 36" min | General Note 6 |
| Guard opening | 4" object shall not pass | General Note 6 |
| Guard post spacing | 6 ft o.c. max | General Note 7 |
| Handrail height | 34"–38" above nosing | General Note 8 |
| Tread nosing / equal risers | 3/4"–1 1/4", all equal | General Note 10 |
| Deck floor to door threshold | within 8 1/4" | General Note 11 |
| No spa loading | Not designed for hot tub or spa | General Note 15 |
| Post size by height | 0–8': 4x4/4x6/6x6 · >8–10': 4x6/6x6 · >10': 6x6 | General Note 17 |

### Sheet 2 — Foundation & Framing Plan, Floor Plan, Front Elevation

| Item | Value |
|---|---|
| 2x4 diagonal brace at bottom of joists | Required on all decks, in all areas |
| Beam overhang | 12" max from center of column |
| Joist overhang | 24" max from center of column |
| Stair width | 36" min (step [8]) |
| Guardrail support post spacing | 6'-0" max |
| Footing depth | 30" min below finished grade |
| 6x6 diagonal bracing | Required at all posts over 10 ft above adjacent grade |

### Sheet 3 — Stair Section and Handrail Sections

| Item | Value |
|---|---|
| Riser height | 8 1/4" max |
| Tread depth | 9" min |
| Handrail height | 34"–38" |
| Balusters | 2x2 at less than 4" spacing |
| Stringers | (3) 2x12 min |
| Pier at landing | 12" pier if 4 or more risers |
| Landing | 4" thick min, 36" min |

### Sheet 4 — Post & Beam Detail and Ledger Board Details

| Item | Value |
|---|---|
| Ledger details published for | Siding · Brick Veneer · Brick/Block · Concrete |
| Ledger board size | Same size as deck joist, min |
| Ledger bolts | 1/2", staggered |
| Brick veneer detail | Through bolts/lag screws to rim joist or studs; caulk all bolts with spacer; weep holes unblocked |
| Siding detail | Flashing under siding, over top and behind ledger, drip-edge at ends |
| Footing depth | 2'-6" min |

### Permitting and property — city process pages

| Item | Value | Source |
|---|---|---|
| Tier 1 same-day review | Residential decks under 400 sq ft | Permit Review Process |
| Tier 1 hours | 7:30 a.m.–2:30 p.m. Mon–Fri, first-come first-served | " |
| Tier 2 | Review by appointment, 5 workdays vs 15 | " |
| Permit required for decks | Yes | Residential Permit Guide |
| Historic property | Certificate of Appropriateness from the Urban Conservator, before work starts | Residential Permit Guide + Decks forms page |
| Deck submission package | Building Application · Site Plan · Deck Plan · Required Permit Documentation | Decks forms page |
| Zoning | Reviewed separately; walk-through not offered where in-depth zoning review is needed | Residential Permit Guide |

## Open questions

- [ ] **Dimension [D] is ambiguous in the city's own set.** Sheet 1 heads the
      column "min. thick"; Sheet 4 step [13] calls [D] the required footing
      *depth*. Those are different dimensions. The engine reports this as a
      confirmation rather than failing a job on either reading —
      see `cin-deck-footing-size`. **Ask the plan examiner which it is.**
- [ ] Sheets cross-reference "page 1 of 4" while the set is 5 sheets. Cosmetic,
      but worth knowing which revision is current.
- [ ] The sheet footer stamps the drawing file as `11.15.06`. Confirm with the
      city that this is still the current set before relying on it commercially.
- [ ] Stair geometry beyond the deck sheets (landings at doors, headroom) is not
      encoded. If a job needs it, it comes from the adopted Residential Code of
      Ohio, which is not yet a registered source.
- [ ] **Does the floodplain pull a Tier 1 deck out of same-day review?** The city
      states a project within the floodplain is automatically Tier 3, but that
      sentence sits under the Tier 2 list. `cin-floodplain-tier` reports this
      rather than assuming either way.
- [ ] Separate electrical / plumbing / mechanical permits are encoded as
      needs-confirmation. The permit guide says they "may be necessary" without
      addressing decks specifically — confirm the actual trigger.
- [ ] Nothing is encoded for zoning — setbacks, lot coverage, rear-yard
      encroachment. A deck can be perfectly framed and still be rejected on
      placement. `cin-zoning-not-evaluated` states this on every job so a
      contractor cannot mistake silence for approval.
- [ ] Accepted file types (PDF/JPG/JPEG/TIFF/TIF) are shown in the UI but come
      from the online-permitting flow, not a cited page. Confirm and register a
      source.

## Schedule

`npm run rules:audit` lists any source past its re-check date. All four sheets
re-check every 90 days.
