import type { DeckProject } from "@/lib/engine/types";

/**
 * Seed jobs.
 *
 * Willis is the real Cincinnati job the engine was first run against — built to
 * code, and it should come back clean. Ludlow is the napkin version of a job as
 * a homeowner describes it, kept so the failing path is always visible.
 */
export const SEED_PROJECTS: DeckProject[] = [
  {
    id: "seed-willis-deck",
    name: "Willis deck",
    clientName: "Willis",
    address: "Willis residence, Cincinnati",
    jurisdiction: "cincinnati-oh",
    trade: "deck",
    createdAt: "2026-08-20T14:00:00.000Z",
    updatedAt: "2026-08-20T14:00:00.000Z",

    deckLength: 16,
    deckWidth: 12,
    deckHeightIn: 72,

    joistSize: "2x8",
    joistSpacingIn: 16,
    joistSpanFt: 10,
    spanConfiguration: "single_span",
    beamOverhangIn: 8,
    joistOverhangIn: 12,

    beamSize: "(2) 2x10",
    beamSpanFt: 8,
    postSize: "6x6",
    postSpacingFt: 8,

    footingDiameterIn: 16,
    footingThicknessIn: 8,
    footingDepthIn: 36,

    attachment: "ledger",
    wallCladding: "siding",
    ledgerBoltSpacingIn: 16,

    guardHeightIn: 36,
    guardOpeningIn: 3.5,
    guardPostSpacingFt: 6,

    hasStairs: true,
    stairRisers: 9,
    riserHeightIn: 7.5,
    treadDepthIn: 11,
    stairWidthIn: 36,
    hasHandrail: true,
    handrailHeightIn: 36,

    hasDiagonalBrace: true,
    hasHotTub: false,
    inHistoricDistrict: false,
    inFloodplain: false,

    notes:
      "First real job run through the engine. Built to code; used to check the engine agreed for the right reasons.",
  },
  {
    id: "seed-ludlow-deck",
    name: "Ludlow Ave. deck",
    clientName: "Prospect",
    address: "Ludlow Ave",
    jurisdiction: "cincinnati-oh",
    trade: "deck",
    createdAt: "2026-08-28T16:30:00.000Z",
    updatedAt: "2026-08-28T16:30:00.000Z",

    deckLength: 20,
    deckWidth: 20,
    deckHeightIn: 84,

    joistSize: "2x8",
    joistSpacingIn: 16,
    joistSpanFt: 20,

    beamSize: "(2) 2x12",
    beamSpanFt: 12,
    postSize: "4x4",
    postSpacingFt: 10,

    footingDiameterIn: 12,
    footingDepthIn: 24,

    attachment: "ledger",
    wallCladding: "brick_veneer",

    guardOpeningIn: 5,
    guardPostSpacingFt: 8,

    hasStairs: true,
    stairRisers: 11,
    stairWidthIn: 36,
    hasHandrail: false,

    hasDiagonalBrace: false,
    hasHotTub: true,

    notes:
      "Napkin version of the job as the homeowner described it, hot tub and all. Run it before drawing anything.",
  },
  {
    id: "seed-hyde-park-deck",
    name: "Hyde Park — attached deck with stairs and outdoor kitchen wiring",
    clientName: "Bennett",
    address: "Erie Ave",
    jurisdiction: "cincinnati-oh",
    trade: "deck",
    createdAt: "2026-08-29T09:15:00.000Z",
    updatedAt: "2026-08-29T09:15:00.000Z",

    deckLength: 18,
    deckWidth: 14,
    deckHeightIn: 40,

    joistSize: "2x10",
    joistSpacingIn: 16,
    joistSpanFt: 13,
    spanConfiguration: "single_span",

    beamSize: "(2) 2x10",
    beamSpanFt: 8,
    postSize: "6x6",
    postSpacingFt: 8,

    footingDiameterIn: 14,
    footingThicknessIn: 7,
    footingDepthIn: 30,

    attachment: "ledger",
    wallCladding: "siding",
    ledgerBoltSpacingIn: 16,

    guardHeightIn: 36,
    guardOpeningIn: 3.5,
    guardPostSpacingFt: 6,

    hasStairs: true,
    stairRisers: 5,
    riserHeightIn: 8,
    treadDepthIn: 10,
    stairWidthIn: 36,
    hasHandrail: true,
    handrailHeightIn: 36,

    hasDiagonalBrace: true,
    hasHotTub: false,
    hasElectrical: true,

    notes: "Outdoor kitchen wiring on this one — worth knowing early whether that is a separate permit.",
  },
  {
    id: "seed-mt-lookout-deck",
    name: "Mt. Lookout — historic property, brick veneer",
    clientName: "Alvarez",
    address: "Delta Ave",
    jurisdiction: "cincinnati-oh",
    trade: "deck",
    createdAt: "2026-08-30T11:40:00.000Z",
    updatedAt: "2026-08-30T11:40:00.000Z",

    deckLength: 24,
    deckWidth: 18,
    deckHeightIn: 132,

    joistSize: "2x12",
    joistSpacingIn: 16,
    joistSpanFt: 16,
    spanConfiguration: "multi_span",

    beamSize: "(2) 2x12",
    beamSpanFt: 8,
    postSize: "6x6",
    postSpacingFt: 8,

    footingDiameterIn: 28,
    footingThicknessIn: 14,
    footingDepthIn: 30,

    attachment: "ledger",
    wallCladding: "brick_veneer",
    ledgerBoltSpacingIn: 12,

    guardHeightIn: 36,
    guardOpeningIn: 3.5,
    guardPostSpacingFt: 6,

    hasStairs: true,
    stairRisers: 12,
    riserHeightIn: 8,
    treadDepthIn: 10,
    stairWidthIn: 36,
    hasHandrail: true,
    handrailHeightIn: 36,

    hasDiagonalBrace: true,
    hasPostBracing: true,
    hasHotTub: false,
    inHistoricDistrict: true,

    notes:
      "Framed to the table, but historic designation gates it — the Certificate of Appropriateness runs on its own clock.",
  },
];
