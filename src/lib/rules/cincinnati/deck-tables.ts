import type { JoistSize, JoistSpacing } from "@/lib/engine/types";

/**
 * Cincinnati joist span table.
 *
 * Source: City of Cincinnati "Residential Deck Drawings", Sheet 1 of 5,
 * Framing / Footing Table.
 *
 * IMPORTANT — how to extend this table:
 *   Only set status "verified" after reading the number off the city sheet
 *   yourself. Anything left "unconfirmed" makes the engine say
 *   "needs confirmation" instead of passing or failing the job. That is the
 *   correct behavior. Do not guess a number in here to make the app look
 *   more complete — a wrong number that reads as confirmed is the one failure
 *   mode this product cannot have.
 *
 * Note there is no species dimension in this table, and that is on purpose.
 * General Note 2 on the city's drawing set already settles species at
 * No. 2 Southern Pine or better, so Cincinnati does not print a species
 * column. Generic span calculators ask for species and answer off a table
 * that does not govern here.
 */

export type SpanStatus = "verified" | "unconfirmed";

export interface SpanCell {
  /** Maximum clear span in feet. Null when not yet read off the sheet. */
  maxSpanFt: number | null;
  status: SpanStatus;
  /** ISO date the number was confirmed against the sheet. */
  verifiedOn?: string;
  note?: string;
}

type SpanTable = Record<JoistSize, Record<JoistSpacing, SpanCell>>;

const unconfirmed = (): SpanCell => ({ maxSpanFt: null, status: "unconfirmed" });

export const CINCINNATI_JOIST_SPANS: SpanTable = {
  "2x6": { 12: unconfirmed(), 16: unconfirmed(), 24: unconfirmed() },
  "2x8": {
    12: unconfirmed(),
    16: {
      maxSpanFt: 10,
      status: "verified",
      verifiedOn: "2026-08-31",
      note: 'Read off Sheet 1 of 5, Framing / Footing Table.',
    },
    24: unconfirmed(),
  },
  "2x10": { 12: unconfirmed(), 16: unconfirmed(), 24: unconfirmed() },
  "2x12": { 12: unconfirmed(), 16: unconfirmed(), 24: unconfirmed() },
};

export function lookupJoistSpan(size: JoistSize, spacing: JoistSpacing): SpanCell {
  return CINCINNATI_JOIST_SPANS[size][spacing];
}

/** Coverage stats for the rule-set page. */
export function spanTableCoverage() {
  const cells = Object.values(CINCINNATI_JOIST_SPANS).flatMap((row) => Object.values(row));
  return {
    total: cells.length,
    verified: cells.filter((c) => c.status === "verified").length,
  };
}

/** General Note 2 — species is settled by the city, not asked of the contractor. */
export const CINCINNATI_SPECIES_NOTE = {
  requirement: "No. 2 Southern Pine or better",
  locator: "General Note 2",
  status: "verified" as const,
  verifiedOn: "2026-08-31",
};
