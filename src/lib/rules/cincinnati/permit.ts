import type { DeckProject, Rule } from "@/lib/engine/types";

/**
 * Cincinnati permitting and property rules.
 *
 * These are not framing rules — they decide whether the job can be submitted at
 * all, which review path it lands in, and what else has to be pulled alongside
 * it. A deck can be framed perfectly to the city's table and still be refused
 * because of where it sits.
 */

export const CINCINNATI_PERMIT_RULESET_VERSION = "2026.08.31-1";

const CIN = "cincinnati-oh";
const DECK = "deck";
const ENCODED = "2026-08-31";

/** Tier 1 threshold from the city's Permit Review Process. */
export const TIER_1_MAX_AREA_SQFT = 400;
export const TIER_1_HOURS = "7:30 a.m. to 2:30 p.m., Monday through Friday, first-come first-served";

/** The four forms the city's Decks page lists for a residential deck permit. */
export const DECK_SUBMISSION_FORMS = [
  "Building Application",
  "Site Plan",
  "Deck Plan",
  "Required Permit Documentation",
];

export function deckAreaSqFt(p: DeckProject): number | undefined {
  if (p.deckLength == null || p.deckWidth == null) return undefined;
  return p.deckLength * p.deckWidth;
}

export const cincinnatiPermitRules: Rule<DeckProject>[] = [
  {
    id: "cin-permit-required",
    code: "CIN-PERMIT-010",
    jurisdiction: CIN,
    trade: DECK,
    title: "A building permit is required for a deck",
    category: "jurisdiction",
    sourceId: "cin-residential-permit-guide",
    confidence: "verified",
    encodedOn: ENCODED,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "advisory",
        title: "This deck needs a building permit before work starts",
        why: "Cincinnati lists decks among the residential work that requires a permit.",
        fix: `Submit: ${DECK_SUBMISSION_FORMS.join(", ")}.`,
      });
    },
  },

  {
    id: "cin-tier1-eligibility",
    code: "CIN-PERMIT-020",
    jurisdiction: CIN,
    trade: DECK,
    title: "Tier 1 same-day review eligibility",
    category: "jurisdiction",
    sourceId: "cin-permit-review-process",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => deckAreaSqFt(p) != null,
    check: (p, ctx) => {
      const area = deckAreaSqFt(p)!;
      if (area < TIER_1_MAX_AREA_SQFT) {
        ctx.flag({
          severity: "advisory",
          title: `At ${area} sq ft this deck qualifies for Tier 1 same-day review`,
          why:
            "Residential decks, garages, sheds, alterations and additions under 400 sq ft are reviewed same-day rather than " +
            "going into the standard queue. That is the difference between walking out with a permit and waiting weeks.",
          fix: `Take a complete package to the permit center during Tier 1 hours — ${TIER_1_HOURS}.`,
          observed: `${area} sq ft`,
          required: `Under ${TIER_1_MAX_AREA_SQFT} sq ft`,
        });
      } else {
        ctx.flag({
          severity: "warning",
          title: `At ${area} sq ft this deck is over the 400 sq ft Tier 1 limit`,
          why:
            "Tier 1 same-day review stops at 400 sq ft. Over that, the job goes to review by appointment or standard review — " +
            "a materially longer wait, and worth knowing before you promise the client a date.",
          fix: `Under ${TIER_1_MAX_AREA_SQFT} sq ft keeps same-day review on the table. If the size is fixed, plan the schedule around the longer review.`,
          observed: `${area} sq ft`,
          required: `Under ${TIER_1_MAX_AREA_SQFT} sq ft for Tier 1`,
        });
      }
    },
  },

  {
    id: "cin-floodplain-tier",
    code: "CIN-PERMIT-030",
    jurisdiction: CIN,
    trade: DECK,
    title: "Floodplain pushes the job to standard review",
    category: "property",
    sourceId: "cin-permit-review-process",
    confidence: "needs_confirmation",
    encodedOn: ENCODED,
    appliesTo: (p) => p.inFloodplain === true,
    check: (_p, ctx) => {
      ctx.needsConfirmation({
        title: "This property is in the floodplain",
        why:
          "The city states that a project within the floodplain is automatically reviewed as Tier 3. That sentence sits under the " +
          "Tier 2 list, so whether it also pulls a Tier 1 deck out of same-day review is not spelled out.",
        fix: "Confirm with the permit center whether a floodplain deck under 400 sq ft still gets Tier 1 same-day review.",
        observed: "In floodplain",
      });
    },
  },

  {
    id: "cin-historic-coa",
    code: "CIN-PERMIT-040",
    jurisdiction: CIN,
    trade: DECK,
    title: "Certificate of Appropriateness on a historic property",
    category: "property",
    sourceId: "cin-residential-permit-guide",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.inHistoricDistrict === true,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "blocker",
        title: "A Certificate of Appropriateness is required before work starts",
        why:
          "Historic-designated properties need a Certificate of Appropriateness from the Urban Conservator. It runs on its own " +
          "timeline, separate from the building permit, and starting without it stops the job.",
        fix: "Apply for the Certificate of Appropriateness with the Urban Conservator now — it is listed on the city's deck forms page and gates everything else.",
        required: "Certificate of Appropriateness before work begins",
      });
    },
  },

  {
    id: "cin-zoning-not-evaluated",
    code: "CIN-PERMIT-050",
    jurisdiction: CIN,
    trade: DECK,
    title: "Zoning is reviewed separately and is not checked here",
    category: "jurisdiction",
    sourceId: "cin-residential-permit-guide",
    confidence: "verified",
    encodedOn: ENCODED,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "advisory",
        title: "Setbacks, lot coverage and rear-yard encroachment are not checked by this engine",
        why:
          "Zoning is a separate review from the building code, and the city notes that walk-through review is not offered where " +
          "an in-depth zoning review is needed. A deck can be framed perfectly to the table and still be refused on placement.",
        fix: "Check the setbacks against your lot yourself, and show them on the site plan. This engine does not cover them and does not pretend to.",
      });
    },
  },

  {
    id: "cin-electrical-permit",
    code: "CIN-PERMIT-060",
    jurisdiction: CIN,
    trade: DECK,
    title: "Electrical scope pulls a separate permit",
    category: "trade_permit",
    sourceId: "cin-residential-permit-guide",
    confidence: "needs_confirmation",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasElectrical === true,
    check: (_p, ctx) => {
      ctx.needsConfirmation({
        title: "Lighting or receptacles on this deck likely need a separate electrical permit",
        why:
          "General Note 16 on the drawing set requires exterior stairs and landings to be illuminated, so most decks pick up " +
          "electrical scope whether or not the contractor thinks of it as an electrical job.",
        fix: "Confirm with the permit center whether the electrical goes under this permit or its own, and pull it before the work.",
      });
    },
  },

  {
    id: "cin-plumbing-permit",
    code: "CIN-PERMIT-070",
    jurisdiction: CIN,
    trade: DECK,
    title: "Gas or water scope pulls a separate permit",
    category: "trade_permit",
    sourceId: "cin-residential-permit-guide",
    confidence: "needs_confirmation",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasPlumbing === true,
    check: (_p, ctx) => {
      ctx.needsConfirmation({
        title: "Gas or water run to this deck likely needs a separate plumbing permit",
        why: "Plumbing scope is permitted separately from the deck structure.",
        fix: "Confirm the separate plumbing permit with the permit center before the work.",
      });
    },
  },

  {
    id: "cin-mechanical-permit",
    code: "CIN-PERMIT-080",
    jurisdiction: CIN,
    trade: DECK,
    title: "Mechanical scope pulls a separate permit",
    category: "trade_permit",
    sourceId: "cin-residential-permit-guide",
    confidence: "needs_confirmation",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasMechanical === true,
    check: (_p, ctx) => {
      ctx.needsConfirmation({
        title: "HVAC or gas appliance scope likely needs a separate mechanical permit",
        why: "Mechanical scope is permitted separately from the deck structure.",
        fix: "Confirm the separate mechanical permit with the permit center before the work.",
      });
    },
  },
];
