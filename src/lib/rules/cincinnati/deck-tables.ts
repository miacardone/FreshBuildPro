import type { BeamSize, JoistSize } from "@/lib/engine/types";

/**
 * Cincinnati's Framing / Footing Table, transcribed from the city's own sheet.
 *
 * Source: City of Cincinnati, "Residential Deck Drawings", Sheet 1 of 5,
 * Framing/Footing Table. A copy of the set as transcribed is kept at
 * docs/sources/cincinnati-residential-deck-drawings.pdf.
 *
 * Two things about this table that generic deck tools get wrong:
 *
 *   1. There is no species column. General Note 2 already settles species at
 *      No. 2 Southern Pine or better, so the city never asks.
 *   2. There is no joist-spacing column either. Table note (a) fixes spacing at
 *      "a maximum of 16 oc" for every row. A tool that offers 12"/24" spacing is
 *      offering a choice this table does not make.
 *
 * Never add a value here that has not been read off the sheet.
 */

/** Table note (a): "All joists are spaced a maximum of 16" oc." */
export const MAX_JOIST_SPACING_IN = 16;

/** Floor Joists — "Choose Joist Size", column Max. Span [A]. */
export const CINCINNATI_JOIST_SPANS: Record<JoistSize, number> = {
  "2x6": 8,
  "2x8": 10,
  "2x10": 13,
  "2x12": 16,
};

export interface FootingSize {
  /** "[C] min. dia." in inches. */
  minDiameterIn: number;
  /** "[D] min. thick" in inches. */
  minThicknessIn: number;
}

export interface BeamOption {
  /** The joist size whose group this row sits in. */
  joistSize: JoistSize;
  beamSize: BeamSize;
  /** Column Max. Span [B], feet. */
  maxSpanFt: number;
  /** Footing Size under "Single-Span Floor Joists". */
  footingSingleSpan: FootingSize;
  /** Footing Size under "Multi-Span Floor Joists". */
  footingMultiSpan: FootingSize;
  /** 1/2" Ledger Board Bolts — spacing, inches. */
  ledgerBoltSpacingIn: number;
}

/**
 * Table note (b): "Choose one floor beam (entire row) that corresponds with the
 * size of joist chosen." The entire row travels together — beam span, both
 * footing sizes, and the ledger bolt spacing.
 */
export const CINCINNATI_BEAM_OPTIONS: BeamOption[] = [
  // Joist 2x6
  { joistSize: "2x6", beamSize: "(2) 2x6", maxSpanFt: 5, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 15, minThicknessIn: 8 }, ledgerBoltSpacingIn: 24 },
  { joistSize: "2x6", beamSize: "(2) 2x8", maxSpanFt: 7, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 16, minThicknessIn: 8 }, ledgerBoltSpacingIn: 24 },
  { joistSize: "2x6", beamSize: "(2) 2x10", maxSpanFt: 9, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 18, minThicknessIn: 9 }, ledgerBoltSpacingIn: 24 },
  { joistSize: "2x6", beamSize: "(2) 2x12", maxSpanFt: 11, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 20, minThicknessIn: 10 }, ledgerBoltSpacingIn: 24 },

  // Joist 2x8
  { joistSize: "2x8", beamSize: "(2) 2x8", maxSpanFt: 7, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 20, minThicknessIn: 10 }, ledgerBoltSpacingIn: 16 },
  { joistSize: "2x8", beamSize: "(2) 2x10", maxSpanFt: 9, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 22, minThicknessIn: 11 }, ledgerBoltSpacingIn: 16 },
  { joistSize: "2x8", beamSize: "(2) 2x12", maxSpanFt: 10, footingSingleSpan: { minDiameterIn: 12, minThicknessIn: 6 }, footingMultiSpan: { minDiameterIn: 22, minThicknessIn: 11 }, ledgerBoltSpacingIn: 16 },

  // Joist 2x10
  { joistSize: "2x10", beamSize: "(2) 2x10", maxSpanFt: 8, footingSingleSpan: { minDiameterIn: 14, minThicknessIn: 7 }, footingMultiSpan: { minDiameterIn: 24, minThicknessIn: 12 }, ledgerBoltSpacingIn: 16 },
  { joistSize: "2x10", beamSize: "(2) 2x12", maxSpanFt: 9, footingSingleSpan: { minDiameterIn: 14, minThicknessIn: 7 }, footingMultiSpan: { minDiameterIn: 26, minThicknessIn: 13 }, ledgerBoltSpacingIn: 16 },

  // Joist 2x12
  { joistSize: "2x12", beamSize: "(2) 2x12", maxSpanFt: 8, footingSingleSpan: { minDiameterIn: 16, minThicknessIn: 8 }, footingMultiSpan: { minDiameterIn: 28, minThicknessIn: 14 }, ledgerBoltSpacingIn: 12 },
];

export function beamOptionsFor(joistSize: JoistSize): BeamOption[] {
  return CINCINNATI_BEAM_OPTIONS.filter((b) => b.joistSize === joistSize);
}

export function findBeamOption(joistSize: JoistSize, beamSize: BeamSize): BeamOption | undefined {
  return CINCINNATI_BEAM_OPTIONS.find((b) => b.joistSize === joistSize && b.beamSize === beamSize);
}

/**
 * General Note 17 — post size is set by deck floor height above finished grade
 * at the highest point. Note the city allows 4x4 up to 8 ft; a tool that
 * insists on 6x6 everywhere is inventing a requirement.
 */
export const POST_SIZE_BY_HEIGHT = [
  { maxHeightFt: 8, allowed: ["4x4", "4x6", "6x6"] as const, label: "0' to 8' high" },
  { maxHeightFt: 10, allowed: ["4x6", "6x6"] as const, label: "over 8' to 10' high" },
  { maxHeightFt: Infinity, allowed: ["6x6"] as const, label: "over 10' high" },
];

/** General Note 2. Cincinnati settles species so the table doesn't need a column. */
export const CINCINNATI_SPECIES = "No. 2 Southern Pine, or better";

/** Verified constants, each tied to the sheet it was read from. */
export const CINCINNATI_DECK_LIMITS = {
  /** General Note 5. */
  guardRequiredAboveGradeIn: 30,
  /** General Note 6. */
  guardMinHeightIn: 36,
  /** General Note 6 — a 4" diameter object shall not pass through. */
  guardMaxOpeningIn: 4,
  /** General Note 7. */
  guardPostMaxSpacingFt: 6,
  /** General Note 8 / Sheet 3, Stair Section View. */
  handrailMinHeightIn: 34,
  handrailMaxHeightIn: 38,
  /** Sheet 3, Stair Section View — "8 1/4" max. all risers". */
  stairMaxRiserIn: 8.25,
  /** Sheet 3, Stair Section View — "9" min." tread. */
  stairMinTreadIn: 9,
  /** Sheet 2 [8], Deck Finished Floor Plan. */
  stairMinWidthIn: 36,
  /** Sheet 3 — "12" pier if 4 or more risers". */
  stairPierRequiredAtRisers: 4,
  /** Sheet 2 Front Elevation and Sheet 4 Post & Beam Detail — 30" / 2'-6" min. */
  footingMinDepthIn: 30,
  /** Sheet 2, Foundation & Framing Plan. */
  beamMaxOverhangIn: 12,
  joistMaxOverhangIn: 24,
  /** General Note 17 / Sheet 2 / Sheet 4 — 6x6 diagonal bracing trigger. */
  diagonalBracingRequiredAboveGradeFt: 10,
  /** General Note 11. */
  maxDropFromDoorThresholdIn: 8.25,
} as const;
