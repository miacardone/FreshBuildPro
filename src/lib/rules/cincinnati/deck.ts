import type { DeckProject, Rule } from "@/lib/engine/types";
import {
  beamOptionsFor,
  CINCINNATI_DECK_LIMITS as L,
  CINCINNATI_JOIST_SPANS,
  CINCINNATI_SPECIES,
  findBeamOption,
  MAX_JOIST_SPACING_IN,
  POST_SIZE_BY_HEIGHT,
} from "@/lib/rules/cincinnati/deck-tables";

/**
 * Cincinnati residential deck rule set.
 *
 * Every rule below was read off the city's own "Residential Deck Drawings" set
 * (a copy is in docs/sources/). Each cites the sheet it came from, because that
 * is the sheet the plan examiner is reading.
 *
 * A rule marked `needs_confirmation` has its shape encoded but its threshold not
 * yet confirmed — the engine reports it instead of asserting. See
 * docs/RULE_VERIFICATION.md.
 */

export const CINCINNATI_DECK_RULESET_VERSION = "2026.08.31-2";

const CIN = "cincinnati-oh";
const DECK = "deck";
const ENCODED = "2026-08-31";

/** Deck height in inches → feet, for the notes that speak in feet. */
const ft = (inches: number) => inches / 12;

export const cincinnatiDeckRules: Rule<DeckProject>[] = [
  /* ================================================================ framing */
  {
    id: "cin-deck-joist-spacing",
    code: "CIN-DECK-010",
    jurisdiction: CIN,
    trade: DECK,
    title: "Joist spacing at 16 in o.c. maximum",
    category: "framing",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.joistSpacingIn != null,
    check: (p, ctx) => {
      if (p.joistSpacingIn! > MAX_JOIST_SPACING_IN) {
        ctx.flag({
          severity: "blocker",
          title: `Joist spacing of ${p.joistSpacingIn}" o.c. exceeds the 16" o.c. maximum the city's table is built on`,
          why:
            "Table note (a) on Sheet 1 fixes spacing at a maximum of 16\" o.c. for every row. " +
            "Off that spacing, none of the spans on the sheet apply to your deck and the examiner has nothing to check you against.",
          fix: 'Tighten the joists to 16" o.c. or closer.',
          observed: `${p.joistSpacingIn}" o.c.`,
          required: `${MAX_JOIST_SPACING_IN}" o.c. maximum`,
        });
        return;
      }
      ctx.confirms({
        title: `Joists at ${p.joistSpacingIn}" o.c. — within the spacing the city's table is built on`,
        observed: `${p.joistSpacingIn}" o.c.`,
        required: `${MAX_JOIST_SPACING_IN}" o.c. maximum`,
      });
    },
  },

  {
    id: "cin-deck-joist-span",
    code: "CIN-DECK-020",
    jurisdiction: CIN,
    trade: DECK,
    title: "Joist span within the city's framing table",
    category: "framing",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => !!p.joistSize && p.joistSpanFt != null,
    check: (p, ctx) => {
      const max = CINCINNATI_JOIST_SPANS[p.joistSize!];
      if (p.joistSpanFt! > max) {
        ctx.flag({
          severity: "blocker",
          title: `Joist span of ${p.joistSpanFt} ft exceeds Cincinnati's maximum allowable span of ${max} ft for ${p.joistSize} joists at 16" o.c.`,
          why:
            "The plan examiner checks the span against the Framing/Footing Table first. Over the table span is a rejection, not a comment.",
          fix: "Reduce the span, add a beam line, or size up the joist.",
          observed: `${p.joistSpanFt} ft`,
          required: `${max} ft maximum`,
        });
        return;
      }
      ctx.confirms({
        title: `${p.joistSize} joists spanning ${p.joistSpanFt} ft at 16" o.c. — within the city's table`,
        observed: `${p.joistSpanFt} ft`,
        required: `${max} ft maximum`,
      });
    },
  },

  {
    id: "cin-deck-beam-row",
    code: "CIN-DECK-030",
    jurisdiction: CIN,
    trade: DECK,
    title: "Beam size is one of the rows offered for that joist",
    category: "framing",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    escalatesToEngineering: true,
    appliesTo: (p) => !!p.joistSize && !!p.beamSize,
    check: (p, ctx) => {
      const option = findBeamOption(p.joistSize!, p.beamSize!);
      if (!option) {
        const allowed = beamOptionsFor(p.joistSize!).map((b) => b.beamSize);
        ctx.flag({
          severity: "blocker",
          title: `${p.beamSize} is not one of the beam rows the table offers for ${p.joistSize} joists`,
          why:
            'Table note (b) says to choose one floor beam row that corresponds with the joist size chosen. ' +
            "Off-table combinations are not covered by this drawing set, which means an engineered design instead of a stock permit.",
          fix: `For ${p.joistSize} joists the table offers ${allowed.join(", ")}.`,
          observed: `${p.beamSize} with ${p.joistSize} joists`,
          required: allowed.join(" / "),
        });
        return;
      }
      ctx.confirms({
        title: `${p.beamSize} is an offered beam row for ${p.joistSize} joists`,
        observed: `${p.beamSize} with ${p.joistSize} joists`,
      });
    },
  },

  {
    id: "cin-deck-beam-span",
    code: "CIN-DECK-040",
    jurisdiction: CIN,
    trade: DECK,
    title: "Beam span within the city's framing table",
    category: "framing",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => !!p.joistSize && !!p.beamSize && p.beamSpanFt != null,
    check: (p, ctx) => {
      const option = findBeamOption(p.joistSize!, p.beamSize!);
      if (!option) return; // cin-deck-beam-row already flagged this
      if (p.beamSpanFt! > option.maxSpanFt) {
        ctx.flag({
          severity: "blocker",
          title: `Beam span of ${p.beamSpanFt} ft exceeds the ${option.maxSpanFt} ft maximum for ${option.beamSize} under ${p.joistSize} joists`,
          why: "Beam span is column [B] on the same table the examiner reads the joist span from.",
          fix: `Bring the posts in to ${option.maxSpanFt} ft or less, or move to a deeper beam row.`,
          observed: `${p.beamSpanFt} ft`,
          required: `${option.maxSpanFt} ft maximum`,
        });
        return;
      }
      ctx.confirms({
        title: `${option.beamSize} beam spanning ${p.beamSpanFt} ft — within the table row`,
        observed: `${p.beamSpanFt} ft`,
        required: `${option.maxSpanFt} ft maximum`,
      });
    },
  },

  {
    id: "cin-deck-overhangs",
    code: "CIN-DECK-050",
    jurisdiction: CIN,
    trade: DECK,
    title: "Beam and joist overhang past the column",
    category: "framing",
    sourceId: "cin-deck-sheet2",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.beamOverhangIn != null || p.joistOverhangIn != null,
    check: (p, ctx) => {
      if (p.beamOverhangIn != null && p.beamOverhangIn > L.beamMaxOverhangIn) {
        ctx.flag({
          severity: "blocker",
          title: `Beam overhang of ${p.beamOverhangIn}" exceeds the 12" maximum`,
          why: 'Sheet 2 calls out 12" max. beam overhang measured from the center of the column.',
          fix: "Shorten the overhang or move the post out.",
          observed: `${p.beamOverhangIn}"`,
          required: `${L.beamMaxOverhangIn}" maximum, measured from the center of the column`,
        });
      }
      if (p.joistOverhangIn != null && p.joistOverhangIn > L.joistMaxOverhangIn) {
        ctx.flag({
          severity: "blocker",
          title: `Joist overhang of ${p.joistOverhangIn}" exceeds the 24" maximum`,
          why: 'Sheet 2 calls out 24" max. joist overhang measured from the center of the column.',
          fix: "Shorten the overhang or move the beam line out.",
          observed: `${p.joistOverhangIn}"`,
          required: `${L.joistMaxOverhangIn}" maximum, measured from the center of the column`,
        });
      }
      const beamOk = p.beamOverhangIn == null || p.beamOverhangIn <= L.beamMaxOverhangIn;
      const joistOk = p.joistOverhangIn == null || p.joistOverhangIn <= L.joistMaxOverhangIn;
      if (beamOk && joistOk) {
        ctx.confirms({
          title: "Beam and joist overhangs are within the city's limits",
          observed: [
            p.beamOverhangIn != null ? `beam ${p.beamOverhangIn}"` : null,
            p.joistOverhangIn != null ? `joist ${p.joistOverhangIn}"` : null,
          ]
            .filter(Boolean)
            .join(", "),
          required: `beam ${L.beamMaxOverhangIn}" / joist ${L.joistMaxOverhangIn}" maximum`,
        });
      }
    },
  },

  {
    id: "cin-deck-species-settled",
    code: "CIN-DECK-060",
    jurisdiction: CIN,
    trade: DECK,
    title: "Lumber species is settled by General Note 2",
    category: "materials",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "advisory",
        title: `Cincinnati does not ask for lumber species — General Note 2 already sets it at ${CINCINNATI_SPECIES}`,
        why:
          "That is why the city's table has no species column, and no spacing column either. A generic span calculator asks " +
          "for both and then answers off a table that does not govern here.",
        fix: `Specify ${CINCINNATI_SPECIES} on the plan and read spans off the city's Framing/Footing Table.`,
        required: CINCINNATI_SPECIES,
      });
    },
  },

  /* =============================================================== footings */
  {
    id: "cin-deck-footing-size",
    code: "CIN-DECK-070",
    jurisdiction: CIN,
    trade: DECK,
    title: "Footing diameter and thickness from the table row",
    category: "footings",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) =>
      !!p.joistSize && !!p.beamSize && !!p.spanConfiguration && (p.footingDiameterIn != null || p.footingThicknessIn != null),
    check: (p, ctx) => {
      const option = findBeamOption(p.joistSize!, p.beamSize!);
      if (!option) return;
      const single = p.spanConfiguration === "single_span";
      const required = single ? option.footingSingleSpan : option.footingMultiSpan;
      const config = single ? "single-span" : "multi-span";

      if (p.footingDiameterIn != null && p.footingDiameterIn < required.minDiameterIn) {
        ctx.flag({
          severity: "blocker",
          title: `Footing diameter of ${p.footingDiameterIn}" is under the ${required.minDiameterIn}" minimum for this row`,
          why: `The table sizes footings off the beam row and whether the joists are single- or multi-span. This is the ${config} column for ${option.beamSize}.`,
          fix: `Pour ${required.minDiameterIn}" diameter footings, or change the beam row.`,
          observed: `${p.footingDiameterIn}" diameter`,
          required: `${required.minDiameterIn}" minimum diameter [C]`,
        });
      }
      if (p.footingThicknessIn != null && p.footingThicknessIn < required.minThicknessIn) {
        // The city's own set is ambiguous about dimension [D]. Sheet 1 heads the
        // column "min. thick", but Sheet 4 step [13] calls [D] the required
        // footing DEPTH. Those are different dimensions, so the engine reports
        // the mismatch rather than picking a reading and failing a job on it.
        ctx.needsConfirmation({
          title: `Footing dimension [D] of ${p.footingThicknessIn}" is under the ${required.minThicknessIn}" the table gives for this row`,
          why:
            'Sheet 1 heads column [D] "min. thick", but Sheet 4 step [13] calls [D] the required footing depth. ' +
            "Those are two different dimensions and the set does not resolve it, so this is a question for the plan examiner, not a call the engine should make.",
          fix: `Confirm with the city whether [D] is thickness or depth for this row (${config} column, ${option.beamSize}), then set the footing to at least ${required.minThicknessIn}" on that dimension.`,
          observed: `${p.footingThicknessIn}"`,
          required: `${required.minThicknessIn}" per column [D]`,
        });
      }
    },
  },

  {
    id: "cin-deck-footing-depth",
    code: "CIN-DECK-080",
    jurisdiction: CIN,
    trade: DECK,
    title: "Footing depth below grade",
    category: "footings",
    sourceId: "cin-deck-sheet4",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.footingDepthIn != null,
    check: (p, ctx) => {
      if (p.footingDepthIn! < L.footingMinDepthIn) {
        ctx.flag({
          severity: "blocker",
          title: `Footing depth of ${p.footingDepthIn}" is under the 30" minimum`,
          why:
            'The Front Elevation on Sheet 2 and the Post & Beam Detail on Sheet 4 both dimension the footing at 30" (2\'-6") minimum below finished grade.',
          fix: 'Take the footings down to at least 30" below finished grade.',
          observed: `${p.footingDepthIn}"`,
          required: `${L.footingMinDepthIn}" minimum below finished grade`,
        });
        return;
      }
      ctx.confirms({
        title: `Footings at ${p.footingDepthIn}" below grade — at or past the city's minimum`,
        observed: `${p.footingDepthIn}"`,
        required: `${L.footingMinDepthIn}" minimum`,
      });
    },
  },

  /* ============================================================ posts, bracing */
  {
    id: "cin-deck-post-size",
    code: "CIN-DECK-090",
    jurisdiction: CIN,
    trade: DECK,
    title: "Post size for the deck height",
    category: "framing",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => !!p.postSize && p.deckHeightIn != null,
    check: (p, ctx) => {
      const heightFt = ft(p.deckHeightIn!);
      const band = POST_SIZE_BY_HEIGHT.find((b) => heightFt <= b.maxHeightFt)!;
      const allowed = band.allowed as readonly string[];
      if (!allowed.includes(p.postSize!)) {
        ctx.flag({
          severity: "blocker",
          title: `${p.postSize} posts are not allowed at a deck height of ${p.deckHeightIn}"`,
          why: `General Note 17 sets post size off the deck floor height above finished grade at the highest point. At ${band.label}, the city allows ${allowed.join(", ")}.`,
          fix: `Use ${allowed.join(" or ")} posts.`,
          observed: `${p.postSize} at ${p.deckHeightIn}" (${heightFt.toFixed(1)} ft)`,
          required: `${allowed.join(" / ")} for ${band.label}`,
        });
        return;
      }
      ctx.confirms({
        title: `${p.postSize} posts at ${p.deckHeightIn}" above grade — allowed at this height`,
        observed: `${p.postSize} at ${p.deckHeightIn}" (${heightFt.toFixed(1)} ft)`,
        required: `${allowed.join(" / ")} for ${band.label}`,
      });
    },
  },

  {
    id: "cin-deck-diagonal-brace",
    code: "CIN-DECK-100",
    jurisdiction: CIN,
    trade: DECK,
    title: "2x4 diagonal brace at the joists",
    category: "lateral",
    sourceId: "cin-deck-sheet2",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasDiagonalBrace != null,
    check: (p, ctx) => {
      if (p.hasDiagonalBrace === false) {
        ctx.flag({
          severity: "blocker",
          title: "No 2x4 diagonal brace shown at the bottom of the joists",
          why:
            'Sheet 2 calls this out as "required on all decks, in all areas" — it is not height-dependent and not optional. ' +
            "A plan without it is missing a detail the examiner is looking for.",
          fix: "Add the 2x4 diagonal brace attached to the bottom of the joists and show it on the framing plan.",
          required: "Required on all decks, in all areas",
        });
        return;
      }
      ctx.confirms({
        title: "2x4 diagonal brace shown at the bottom of the joists",
        required: "Required on all decks, in all areas",
      });
    },
  },

  {
    id: "cin-deck-post-bracing",
    code: "CIN-DECK-110",
    jurisdiction: CIN,
    trade: DECK,
    title: "6x6 diagonal bracing over 10 ft above grade",
    category: "lateral",
    sourceId: "cin-deck-sheet4",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.deckHeightIn != null && ft(p.deckHeightIn) > L.diagonalBracingRequiredAboveGradeFt,
    check: (p, ctx) => {
      if (p.hasPostBracing !== true) {
        ctx.flag({
          severity: "blocker",
          title: `6x6 diagonal bracing is required at all posts on a deck ${ft(p.deckHeightIn!).toFixed(1)} ft above grade`,
          why:
            "Sheets 2 and 4 both require 6x6 diagonal bracing at all posts when the deck/porch floor exceeds 10 ft above any adjacent grade.",
          fix: "Add 6x6 diagonal bracing at all posts, bolted with 1/2\" dia. carriage bolts, and show it on the elevation.",
          observed: `${p.deckHeightIn}" above grade, bracing not indicated`,
          required: "6x6 diagonal bracing at all posts over 10 ft",
        });
        return;
      }
      ctx.confirms({
        title: `6x6 diagonal bracing shown, as required over 10 ft above grade`,
        observed: `${p.deckHeightIn}" above grade`,
        required: "6x6 diagonal bracing at all posts over 10 ft",
      });
    },
  },

  /* ============================================================= attachment */
  {
    id: "cin-deck-ledger-detail",
    code: "CIN-DECK-120",
    jurisdiction: CIN,
    trade: DECK,
    title: "Ledger board detail for the wall type",
    category: "attachment",
    sourceId: "cin-deck-sheet4",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.attachment === "ledger" && !!p.wallCladding,
    check: (p, ctx) => {
      // Cincinnati publishes a detail for every one of these wall types,
      // brick veneer included. The finding is which detail to show, not whether
      // the attachment is allowed.
      const details: Record<string, { label: string; requirements: string }> = {
        siding: {
          label: "Siding Applications",
          requirements:
            "Flashing from under the siding, over the top and behind the ledger board, with drip-edge at the ends; through bolts or lag screws into the rim joist or wall studs.",
        },
        brick_veneer: {
          label: "Brick Veneer Applications",
          requirements:
            "Through bolts or lag screws into the rim joist or wall studs; caulk around all ledger bolts with a spacer to allow drying; weep holes left unblocked and uncovered.",
        },
        brick_block: {
          label: "Brick/Block Applications",
          requirements:
            "Through bolts or expansion anchors, minimum two bolts at each end; caulk around all ledger bolts with a spacer to allow drying.",
        },
        concrete: {
          label: "Concrete Applications",
          requirements:
            "Through bolts or expansion anchors; caulk around all ledger bolts with a spacer to allow drying.",
        },
      };
      const d = details[p.wallCladding!];
      if (!d) return;

      ctx.flag({
        severity: "advisory",
        title: `Show the "${d.label}" ledger detail from Sheet 4`,
        why:
          "Cincinnati publishes a ledger detail for this wall type, so the attachment is a matter of showing the right detail — " +
          "not of redesigning the deck. The ledger board must be at least the same size as the deck joist, hung with metal joist hangers.",
        fix: d.requirements,
        observed: d.label,
      });
    },
  },

  {
    id: "cin-deck-ledger-bolt-spacing",
    code: "CIN-DECK-130",
    jurisdiction: CIN,
    trade: DECK,
    title: "1/2 in ledger bolt spacing from the table row",
    category: "attachment",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.attachment === "ledger" && !!p.joistSize && !!p.beamSize,
    check: (p, ctx) => {
      const option = findBeamOption(p.joistSize!, p.beamSize!);
      if (!option) return;
      const required = option.ledgerBoltSpacingIn;

      if (p.ledgerBoltSpacingIn == null) {
        ctx.flag({
          severity: "warning",
          title: `Ledger bolt spacing is not on the plan — this row calls for ${required}" o.c.`,
          why:
            'The last column of the Framing/Footing Table sets 1/2" ledger board bolt spacing per beam row. ' +
            "The examiner reads it off the same row as your spans.",
          fix: `Show 1/2" bolts at ${required}" o.c., staggered, on the ledger detail.`,
          required: `${required}" o.c. for ${option.beamSize} under ${p.joistSize} joists`,
        });
        return;
      }

      if (p.ledgerBoltSpacingIn > required) {
        ctx.flag({
          severity: "blocker",
          title: `Ledger bolts at ${p.ledgerBoltSpacingIn}" o.c. are wider than the ${required}" o.c. this row requires`,
          why: "Bolt spacing tightens as the beam gets deeper, because the ledger is carrying more.",
          fix: `Bring the 1/2" bolts to ${required}" o.c. and stagger them.`,
          observed: `${p.ledgerBoltSpacingIn}" o.c.`,
          required: `${required}" o.c. maximum, staggered`,
        });
        return;
      }
      ctx.confirms({
        title: `1/2" ledger bolts at ${p.ledgerBoltSpacingIn}" o.c. — matches this beam row`,
        observed: `${p.ledgerBoltSpacingIn}" o.c.`,
        required: `${required}" o.c. maximum, staggered`,
      });
    },
  },

  /* ================================================================= guards */
  {
    id: "cin-deck-guard-required",
    code: "CIN-DECK-140",
    jurisdiction: CIN,
    trade: DECK,
    title: "Guard required over 30 in above grade",
    category: "guards",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.deckHeightIn != null && p.deckHeightIn > L.guardRequiredAboveGradeIn,
    check: (p, ctx) => {
      if (p.guardHeightIn == null) {
        ctx.flag({
          severity: "blocker",
          title: `A guard is required on a deck ${p.deckHeightIn}" above grade, and none is on the plan`,
          why:
            "General Note 5 requires guards wherever the deck floor is greater than 30\" above grade at any point. " +
            "A missing guard is one of the most common reasons a deck plan comes back.",
          fix: `Show a guard at least ${L.guardMinHeightIn}" tall with openings that will not pass a 4" object.`,
          observed: `${p.deckHeightIn}" above grade, no guard shown`,
          required: `Guard required over ${L.guardRequiredAboveGradeIn}" above grade`,
        });
        return;
      }
      if (p.guardHeightIn < L.guardMinHeightIn) {
        ctx.flag({
          severity: "blocker",
          title: `Guard height of ${p.guardHeightIn}" is under the 36" minimum`,
          why: "General Note 6 sets required guards at 36\" tall minimum.",
          fix: `Raise the guard to at least ${L.guardMinHeightIn}".`,
          observed: `${p.guardHeightIn}"`,
          required: `${L.guardMinHeightIn}" minimum`,
        });
        return;
      }
      ctx.confirms({
        title: `Guard at ${p.guardHeightIn}" on a deck ${p.deckHeightIn}" above grade — required here, and tall enough`,
        observed: `${p.guardHeightIn}" guard`,
        required: `${L.guardMinHeightIn}" minimum`,
      });
    },
  },

  {
    id: "cin-deck-guard-opening",
    code: "CIN-DECK-150",
    jurisdiction: CIN,
    trade: DECK,
    title: "Guard opening will not pass a 4 in object",
    category: "guards",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.guardOpeningIn != null,
    check: (p, ctx) => {
      if (p.guardOpeningIn! >= L.guardMaxOpeningIn) {
        ctx.flag({
          severity: "blocker",
          title: `Guard openings of ${p.guardOpeningIn}" will pass a 4" object`,
          why:
            'General Note 6 requires guards constructed so a 4" diameter object will not pass through. ' +
            "It is checked on the plan and again at inspection.",
          fix: 'Tighten the baluster spacing to under 4" — Sheet 2 shows 2x2 balusters at less than 4" spacing.',
          observed: `${p.guardOpeningIn}" opening`,
          required: 'Less than 4"',
        });
        return;
      }
      ctx.confirms({
        title: `Guard openings of ${p.guardOpeningIn}" will not pass a 4" object`,
        observed: `${p.guardOpeningIn}" opening`,
        required: 'Less than 4"',
      });
    },
  },

  {
    id: "cin-deck-guard-post-spacing",
    code: "CIN-DECK-160",
    jurisdiction: CIN,
    trade: DECK,
    title: "Guard post spacing at 6 ft o.c. maximum",
    category: "guards",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.guardPostSpacingFt != null,
    check: (p, ctx) => {
      if (p.guardPostSpacingFt! > L.guardPostMaxSpacingFt) {
        ctx.flag({
          severity: "blocker",
          title: `Guard posts at ${p.guardPostSpacingFt} ft o.c. exceed the 6 ft maximum`,
          why:
            "General Note 7 caps guard post spacing at 6 ft on center, and Sheet 2 repeats it as 6'-0\" max typical for all guardrail support posts.",
          fix: "Add posts to bring the spacing to 6 ft or less.",
          observed: `${p.guardPostSpacingFt} ft o.c.`,
          required: `${L.guardPostMaxSpacingFt} ft o.c. maximum`,
        });
        return;
      }
      ctx.confirms({
        title: `Guard posts at ${p.guardPostSpacingFt} ft o.c. — within the 6 ft maximum`,
        observed: `${p.guardPostSpacingFt} ft o.c.`,
        required: `${L.guardPostMaxSpacingFt} ft o.c. maximum`,
      });
    },
  },

  /* ================================================================= stairs */
  {
    id: "cin-deck-stair-riser",
    code: "CIN-DECK-170",
    jurisdiction: CIN,
    trade: DECK,
    title: "Stair riser height",
    category: "stairs",
    sourceId: "cin-deck-sheet3",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasStairs === true && p.riserHeightIn != null,
    check: (p, ctx) => {
      if (p.riserHeightIn! > L.stairMaxRiserIn) {
        ctx.flag({
          severity: "blocker",
          title: `Riser height of ${p.riserHeightIn}" exceeds Cincinnati's 8 1/4" maximum`,
          why:
            'Sheet 3 dimensions risers at 8 1/4" max. Note this is not the 7 3/4" a generic IRC-based calculator will tell you — ' +
            "the number that governs here is the one on this sheet.",
          fix: `Add a riser to bring each one to ${L.stairMaxRiserIn}" or less. General Note 10 also requires all risers to be equal.`,
          observed: `${p.riserHeightIn}"`,
          required: `${L.stairMaxRiserIn}" maximum`,
        });
        return;
      }
      ctx.confirms({
        title: `Risers at ${p.riserHeightIn}" — within Cincinnati's 8 1/4" maximum`,
        observed: `${p.riserHeightIn}"`,
        required: `${L.stairMaxRiserIn}" maximum`,
      });
    },
  },

  {
    id: "cin-deck-stair-tread",
    code: "CIN-DECK-180",
    jurisdiction: CIN,
    trade: DECK,
    title: "Stair tread depth",
    category: "stairs",
    sourceId: "cin-deck-sheet3",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasStairs === true && p.treadDepthIn != null,
    check: (p, ctx) => {
      if (p.treadDepthIn! < L.stairMinTreadIn) {
        ctx.flag({
          severity: "blocker",
          title: `Tread depth of ${p.treadDepthIn}" is under Cincinnati's 9" minimum`,
          why:
            'Sheet 3 dimensions treads at 9" min. A generic calculator will hold you to 10" off a table that does not govern here.',
          fix: `Deepen the tread to at least ${L.stairMinTreadIn}", with a 3/4" to 1-1/4" nosing on closed risers.`,
          observed: `${p.treadDepthIn}"`,
          required: `${L.stairMinTreadIn}" minimum`,
        });
        return;
      }
      ctx.confirms({
        title: `Treads at ${p.treadDepthIn}" — at or past Cincinnati's 9" minimum`,
        observed: `${p.treadDepthIn}"`,
        required: `${L.stairMinTreadIn}" minimum`,
      });
    },
  },

  {
    id: "cin-deck-stair-width",
    code: "CIN-DECK-190",
    jurisdiction: CIN,
    trade: DECK,
    title: "Stair width at 36 in minimum",
    category: "stairs",
    sourceId: "cin-deck-sheet2",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasStairs === true && p.stairWidthIn != null,
    check: (p, ctx) => {
      if (p.stairWidthIn! < L.stairMinWidthIn) {
        ctx.flag({
          severity: "blocker",
          title: `Stair width of ${p.stairWidthIn}" is under the 36" minimum`,
          why: 'Sheet 2 step [8] asks for the stair width in inches and states 36" min.',
          fix: `Widen the stair to at least ${L.stairMinWidthIn}".`,
          observed: `${p.stairWidthIn}"`,
          required: `${L.stairMinWidthIn}" minimum`,
        });
        return;
      }
      ctx.confirms({
        title: `Stair ${p.stairWidthIn}" wide — at or past the 36" minimum`,
        observed: `${p.stairWidthIn}"`,
        required: `${L.stairMinWidthIn}" minimum`,
      });
    },
  },

  {
    id: "cin-deck-stair-handrail",
    code: "CIN-DECK-200",
    jurisdiction: CIN,
    trade: DECK,
    title: "Handrail and its height",
    category: "stairs",
    sourceId: "cin-deck-sheet3",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasStairs === true,
    check: (p, ctx) => {
      if (p.hasHandrail === false) {
        ctx.flag({
          severity: "blocker",
          title: "No handrail shown on the stair",
          why:
            "General Note 8 requires guards and handrails at stairs, and Sheet 3 dimensions the handrail height. " +
            "A missing handrail reliably draws a correction.",
          fix: `Show a handrail ${L.handrailMinHeightIn}"–${L.handrailMaxHeightIn}" above the stair nosing, ending into a post or returned to a wall.`,
          required: `${L.handrailMinHeightIn}"–${L.handrailMaxHeightIn}" above the nosing`,
        });
        return;
      }
      if (p.handrailHeightIn != null) {
        const h = p.handrailHeightIn;
        if (h < L.handrailMinHeightIn || h > L.handrailMaxHeightIn) {
          ctx.flag({
            severity: "blocker",
            title: `Handrail height of ${h}" is outside the 34"–38" range`,
            why: "General Note 8 sets required guards and handrails at stairs to range from 34\" to 38\" vertically above the stair nosing.",
            fix: `Set the handrail between ${L.handrailMinHeightIn}" and ${L.handrailMaxHeightIn}" above the nosing.`,
            observed: `${h}"`,
            required: `${L.handrailMinHeightIn}"–${L.handrailMaxHeightIn}"`,
          });
          return;
        }
      }
      ctx.confirms({
        title: p.handrailHeightIn
          ? `Handrail at ${p.handrailHeightIn}" above the nosing — within the 34"–38" range`
          : "Handrail shown on the stair",
        observed: p.handrailHeightIn ? `${p.handrailHeightIn}"` : undefined,
        required: `${L.handrailMinHeightIn}"–${L.handrailMaxHeightIn}" above the nosing`,
      });
    },
  },

  {
    id: "cin-deck-stair-pier",
    code: "CIN-DECK-210",
    jurisdiction: CIN,
    trade: DECK,
    title: "Pier at the stair landing for 4 or more risers",
    category: "stairs",
    sourceId: "cin-deck-sheet3",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.hasStairs === true && p.stairRisers != null,
    check: (p, ctx) => {
      if (p.stairRisers! >= L.stairPierRequiredAtRisers) {
        ctx.flag({
          severity: "advisory",
          title: `A 12" pier is required at the landing on a ${p.stairRisers}-riser stair`,
          why: 'Sheet 3 calls for a 12" pier if 4 or more risers, with the 2x12 stringers anchored to the concrete landing.',
          fix: 'Show the 12" pier and the stringer anchorage, with a landing at least 4" thick and 36" deep.',
          required: '12" pier at 4 or more risers',
        });
      }
    },
  },

  /* ============================================================= submission */
  {
    id: "cin-deck-hot-tub",
    code: "CIN-DECK-220",
    jurisdiction: CIN,
    trade: DECK,
    title: "This drawing set does not cover spa loading",
    category: "submission",
    sourceId: "cin-deck-sheet1",
    confidence: "verified",
    encodedOn: ENCODED,
    escalatesToEngineering: true,
    appliesTo: (p) => p.hasHotTub === true,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "blocker",
        title: "A hot tub or spa cannot go on this deck under the city's stock drawings",
        why:
          "General Note 15 states this deck/porch is not designed for hot-tub or spa loading. Filing it on the stock set is a rejection.",
        fix: "This one needs an engineered design for the spa load — it is outside what the city's drawing set covers.",
        required: "Engineered design for spa loading",
      });
    },
  },

  {
    id: "cin-deck-span-config",
    code: "CIN-DECK-230",
    jurisdiction: CIN,
    trade: DECK,
    title: "Span configuration is stated",
    category: "submission",
    sourceId: "cin-deck-sheet2",
    confidence: "verified",
    encodedOn: ENCODED,
    appliesTo: (p) => p.spanConfiguration == null,
    check: (_p, ctx) => {
      ctx.flag({
        severity: "warning",
        title: "Single-span or multi-span is not stated",
        why:
          "Sheet 2 step [5] makes you choose one, and the footing sizes on the Sheet 1 table differ between the two columns — " +
          "sometimes by more than double the diameter.",
        fix: "Pick single-span or multi-span so the footing sizes can be checked against the right column.",
      });
    },
  },
];
