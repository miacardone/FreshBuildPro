import type { DeckProject, Rule } from "@/lib/engine/types";
import {
  CINCINNATI_SPECIES_NOTE,
  lookupJoistSpan,
} from "@/lib/rules/cincinnati/deck-tables";

/**
 * Cincinnati residential deck rule set.
 *
 * Each rule is a plain if-this-then-that check tied to one registered source.
 * A rule marked `needs_confirmation` has its shape encoded but its threshold
 * not yet read off the city's document — the engine reports it as something to
 * confirm rather than asserting a pass or a fail. Flip it to `verified` only
 * after confirming the number against the source, and update `encodedOn`.
 *
 * See docs/RULE_VERIFICATION.md for the working checklist.
 */

export const CINCINNATI_DECK_RULESET_VERSION = "2026.08.31-1";

const CIN = "cincinnati-oh";
const DECK = "deck";

export const cincinnatiDeckRules: Rule<DeckProject>[] = [
  /* ------------------------------------------------------------------ framing */
  {
    id: "cin-deck-joist-span",
    jurisdiction: CIN,
    trade: DECK,
    title: "Joist span within the city's framing table",
    category: "framing",
    sourceId: "cin-deck-drawings",
    confidence: "verified",
    encodedOn: "2026-08-31",
    appliesTo: (p) => !!p.joistSize && !!p.joistSpacingIn && p.joistSpanFt != null,
    check: (p, ctx) => {
      const cell = lookupJoistSpan(p.joistSize!, p.joistSpacingIn!);
      const spec = `${p.joistSize} at ${p.joistSpacingIn}" o.c.`;

      if (cell.status !== "verified" || cell.maxSpanFt == null) {
        ctx.needsConfirmation({
          title: `Span limit for ${spec} is not confirmed yet`,
          why:
            "The engine will not pass or fail a span it has not read off the city's own table. " +
            "Submitting on an unconfirmed number is how a job comes back as a correction.",
          fix: `Confirm the maximum span for ${spec} on Sheet 1 of 5 of the city's Residential Deck Drawings, then record it in deck-tables.ts.`,
          observed: `${p.joistSpanFt} ft`,
        });
        return;
      }

      if (p.joistSpanFt! > cell.maxSpanFt) {
        ctx.flag({
          severity: "blocker",
          title: `Joist span of ${p.joistSpanFt} ft exceeds Cincinnati's maximum allowable span of ${cell.maxSpanFt} ft for ${spec}`,
          why:
            "The plan examiner checks the span against this table first. Over the table span is a rejection, not a comment.",
          fix: "Reduce the span, add a beam line, or size up the joist.",
          observed: `${p.joistSpanFt} ft`,
          required: `${cell.maxSpanFt} ft maximum`,
        });
      }
    },
  },

  {
    id: "cin-deck-species-settled",
    jurisdiction: CIN,
    trade: DECK,
    title: "Lumber species is settled by General Note 2",
    category: "materials",
    sourceId: "cin-deck-drawings",
    confidence: "verified",
    encodedOn: "2026-08-31",
    check: (_p, ctx) => {
      ctx.flag({
        severity: "info",
        title: `Cincinnati does not ask for lumber species — it is already set at ${CINCINNATI_SPECIES_NOTE.requirement}`,
        why:
          "General Note 2 on the city's drawing set settles species, which is why the city's table has no species column. " +
          "A generic span calculator will ask you for species and answer off a table that does not govern here.",
        fix: `Specify ${CINCINNATI_SPECIES_NOTE.requirement} on the plan and use the city's table for spans.`,
        required: CINCINNATI_SPECIES_NOTE.requirement,
      });
    },
  },

  {
    id: "cin-deck-beam-span",
    jurisdiction: CIN,
    trade: DECK,
    title: "Beam span within the city's framing table",
    category: "framing",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.beamSpanFt != null,
    check: (p, ctx) => {
      ctx.needsConfirmation({
        title: "Beam span has not been checked against the city's table",
        why:
          "Beam span is on the same sheet as the joist table and gets reviewed the same way, but the numbers are not encoded yet.",
        fix: "Read the beam span row off Sheet 1 of 5 and encode it, then this check becomes a hard pass/fail.",
        observed: `${p.beamSpanFt} ft`,
      });
    },
  },

  /* --------------------------------------------------------------- attachment */
  {
    id: "cin-deck-ledger-brick-veneer",
    jurisdiction: CIN,
    trade: DECK,
    title: "Ledger cannot be carried by brick veneer",
    category: "attachment",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.attachment === "ledger",
    check: (p, ctx) => {
      if (p.wallCladding === "brick_veneer") {
        ctx.needsConfirmation({
          title: "Ledger attachment to a brick-veneer wall",
          why:
            "Brick veneer is a cladding, not structure — a ledger hung off it is one of the attachments that reliably draws a correction. " +
            "The engine is holding this as a confirmation until the city's detail is encoded.",
          fix:
            "Either go freestanding with its own posts and footings, or detail the ledger through the veneer into the rim/band joist and show that detail on the plan. Confirm the city's accepted detail on the drawing set.",
          observed: "Ledger on brick veneer",
        });
      }
      if (p.wallCladding === "stucco") {
        ctx.needsConfirmation({
          title: "Ledger attachment through stucco",
          why: "Flashing and attachment through stucco is a common correction item and the detail has not been encoded yet.",
          fix: "Confirm the city's accepted ledger detail for stucco and show the flashing on the plan.",
          observed: "Ledger on stucco",
        });
      }
    },
  },

  {
    id: "cin-deck-freestanding-noted",
    jurisdiction: CIN,
    trade: DECK,
    title: "Freestanding deck is detailed as freestanding",
    category: "attachment",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.attachment === "freestanding",
    check: (_p, ctx) => {
      ctx.needsConfirmation({
        title: "Freestanding deck — lateral support detail not yet encoded",
        why:
          "A freestanding deck carries its own lateral load, and the examiner looks for that detail. The city's requirement is not encoded yet.",
        fix: "Confirm the city's freestanding lateral/bracing detail and show it on the plan.",
      });
    },
  },

  /* ------------------------------------------------------------------ lateral */
  {
    id: "cin-deck-corner-bracing",
    jurisdiction: CIN,
    trade: DECK,
    title: "Corner bracing at height",
    category: "lateral",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.deckHeightIn != null,
    check: (p, ctx) => {
      if (p.hasCornerBracing === false) {
        ctx.needsConfirmation({
          title: "No corner bracing shown",
          why:
            "Bracing at the posts is a detail the examiner looks for once a deck gets up off the ground. The height at which the city requires it is not encoded yet.",
          fix: "Confirm the bracing requirement and trigger height on the city's drawing set, then show the bracing detail on the plan.",
          observed: `Deck height ${p.deckHeightIn}" — no bracing indicated`,
        });
      }
    },
  },

  {
    id: "cin-deck-post-size",
    jurisdiction: CIN,
    trade: DECK,
    title: "Post size at height",
    category: "framing",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => !!p.postSize && p.deckHeightIn != null,
    check: (p, ctx) => {
      if (p.postSize === "4x4") {
        ctx.needsConfirmation({
          title: '4x4 posts at a deck height of ' + p.deckHeightIn + '"',
          why:
            "Post size is height-dependent and 6x6 is the common call once a deck is up. The city's exact trigger height is not encoded yet.",
          fix: "Confirm the post-size rows on Sheet 1 of 5 against your deck height. If in doubt, 6x6 is the safe call.",
          observed: `4x4 posts at ${p.deckHeightIn}"`,
        });
      }
    },
  },

  /* ----------------------------------------------------------------- footings */
  {
    id: "cin-deck-footing-depth",
    jurisdiction: CIN,
    trade: DECK,
    title: "Footing depth below frost line",
    category: "footings",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.footingDepthIn != null,
    check: (p, ctx) => {
      ctx.needsConfirmation({
        title: "Footing depth has not been checked against the city's frost depth",
        why: "Footing depth is a standard review item and a cheap rejection to avoid.",
        fix: "Confirm Cincinnati's required frost depth on the drawing set's footing table and encode it.",
        observed: `${p.footingDepthIn}" deep`,
      });
    },
  },

  {
    id: "cin-deck-footing-diameter",
    jurisdiction: CIN,
    trade: DECK,
    title: "Footing diameter for tributary load",
    category: "footings",
    sourceId: "cin-deck-drawings",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.footingDiameterIn != null,
    check: (p, ctx) => {
      ctx.needsConfirmation({
        title: "Footing diameter has not been checked against the city's footing table",
        why: "The footing table sizes the pier off the tributary area the post carries.",
        fix: "Encode the footing table from Sheet 1 of 5 so this becomes a hard check.",
        observed: `${p.footingDiameterIn}" diameter`,
      });
    },
  },

  /* ------------------------------------------------------------------- guards */
  {
    id: "cin-deck-guard-required",
    jurisdiction: CIN,
    trade: DECK,
    title: "Guard required above trigger height",
    category: "guards",
    sourceId: "cin-rcbo",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.deckHeightIn != null,
    check: (p, ctx) => {
      if (p.guardHeightIn == null) {
        ctx.needsConfirmation({
          title: `No guard height entered for a deck ${p.deckHeightIn}" above grade`,
          why:
            "A missing guard detail is one of the most common reasons a deck plan comes back. The trigger height and required guard height are not encoded yet.",
          fix: "Confirm the guard trigger height and minimum guard height in the adopted code, then enter the guard height on the job.",
          observed: `Deck height ${p.deckHeightIn}", guard height not entered`,
        });
      }
    },
  },

  {
    id: "cin-deck-guard-opening",
    jurisdiction: CIN,
    trade: DECK,
    title: "Guard infill opening limit",
    category: "guards",
    sourceId: "cin-rcbo",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.guardOpeningIn != null,
    check: (p, ctx) => {
      ctx.needsConfirmation({
        title: "Guard opening has not been checked against the adopted code",
        why: "Infill spacing is checked on the plan and again at inspection.",
        fix: "Confirm the maximum guard opening in the adopted code and encode it.",
        observed: `${p.guardOpeningIn}" opening`,
      });
    },
  },

  /* ------------------------------------------------------------------- stairs */
  {
    id: "cin-deck-stair-geometry",
    jurisdiction: CIN,
    trade: DECK,
    title: "Stair riser and tread geometry",
    category: "stairs",
    sourceId: "cin-rcbo",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.hasStairs === true,
    check: (p, ctx) => {
      if (p.riserHeightIn == null || p.treadDepthIn == null) {
        ctx.needsConfirmation({
          title: "Stair geometry not entered",
          why: "Missing stair details are a standard correction on deck plans.",
          fix: "Enter riser height and tread depth so the stair detail can be checked and drawn.",
        });
        return;
      }
      ctx.needsConfirmation({
        title: "Stair riser/tread limits have not been encoded",
        why: "Riser and tread are checked on the plan and at inspection; the engine will not assert limits it has not confirmed.",
        fix: "Confirm the riser and tread limits in the adopted code and encode them.",
        observed: `${p.riserHeightIn}" riser / ${p.treadDepthIn}" tread`,
      });
    },
  },

  {
    id: "cin-deck-stair-handrail",
    jurisdiction: CIN,
    trade: DECK,
    title: "Handrail where the stair run requires it",
    category: "stairs",
    sourceId: "cin-rcbo",
    confidence: "needs_confirmation",
    encodedOn: "2026-08-31",
    appliesTo: (p) => p.hasStairs === true && p.stairRisers != null,
    check: (p, ctx) => {
      if (p.hasHandrail === false) {
        ctx.needsConfirmation({
          title: `No handrail shown on a ${p.stairRisers}-riser stair`,
          why: "A missing handrail is one of the details that reliably draws a correction.",
          fix: "Confirm the riser count that triggers a handrail in the adopted code, and show the handrail and its height on the plan.",
          observed: `${p.stairRisers} risers, no handrail indicated`,
        });
      }
    },
  },
];
