import type {
  BeamSize,
  DeckProject,
  JoistSize,
  PostSize,
  SpanConfiguration,
} from "@/lib/engine/types";
import {
  beamOptionsFor,
  CINCINNATI_DECK_LIMITS as L,
  CINCINNATI_JOIST_SPANS,
  MAX_JOIST_SPACING_IN,
  POST_SIZE_BY_HEIGHT,
  type BeamOption,
  type FootingSize,
} from "@/lib/rules/cincinnati/deck-tables";
import { TIER_1_MAX_AREA_SQFT, deckAreaSqFt } from "@/lib/rules/cincinnati/permit";

/**
 * The solver.
 *
 * The engine's job is to say a job will be rejected. This is the other half:
 * given the same city table, work backwards to the configurations that pass, so
 * the contractor gets options instead of a verdict.
 *
 * Everything here comes out of the encoded Cincinnati table. The solver never
 * invents a span, a footing or a post size — if it is not on the sheet, it is
 * not an option. Same discipline as the rules; a helpful wrong answer is worse
 * than no answer.
 *
 * Deterministic: same project in, same ranked options out.
 */

const JOIST_SIZES: JoistSize[] = ["2x6", "2x8", "2x10", "2x12"];
const CONFIGS: SpanConfiguration[] = ["single_span", "multi_span"];

/** Rough material weight, used only to prefer the lighter of two passing options. */
const JOIST_WEIGHT: Record<JoistSize, number> = { "2x6": 1, "2x8": 2, "2x10": 3, "2x12": 4 };
const BEAM_WEIGHT: Record<BeamSize, number> = {
  "(2) 2x6": 1,
  "(2) 2x8": 2,
  "(2) 2x10": 3,
  "(2) 2x12": 4,
};

export interface Change {
  field: string;
  from: string;
  to: string;
}

export interface FramingOption {
  joistSize: JoistSize;
  joistSpacingIn: number;
  spanConfiguration: SpanConfiguration;
  /** Clear span between supports this option produces. */
  joistSpanFt: number;
  /** The table maximum for that joist, for context. */
  joistSpanMaxFt: number;
  beamSize: BeamSize;
  /** The furthest apart the posts can sit under this beam row. */
  postSpacingMaxFt: number;
  footing: FootingSize;
  ledgerBoltSpacingIn: number;
  /** Post sizes the city allows at this deck height. Empty when height is unknown. */
  allowedPostSizes: PostSize[];
  changes: Change[];
  /** True when this is what the project already says — nothing to change. */
  isCurrent: boolean;
}

/**
 * The total distance the joists cover from the house to the outer beam.
 *
 * `joistSpanFt` is the clear span between supports, so a deck already framed
 * multi-span covers twice that. Solving on the total, rather than on the stated
 * span, is what lets the solver offer "add a beam line" as an option.
 */
export function totalJoistRunFt(project: DeckProject): number | undefined {
  if (project.joistSpanFt == null) return undefined;
  return project.joistSpanFt * (project.spanConfiguration === "multi_span" ? 2 : 1);
}

function allowedPostSizes(deckHeightIn: number | undefined): PostSize[] {
  if (deckHeightIn == null) return [];
  const band = POST_SIZE_BY_HEIGHT.find((b) => deckHeightIn / 12 <= b.maxHeightFt)!;
  return [...band.allowed];
}

function buildOption(
  project: DeckProject,
  config: SpanConfiguration,
  joistSize: JoistSize,
  row: BeamOption,
  joistSpanFt: number,
): FramingOption {
  const footing = config === "single_span" ? row.footingSingleSpan : row.footingMultiSpan;
  const posts = allowedPostSizes(project.deckHeightIn);
  const changes: Change[] = [];

  if (project.joistSize !== joistSize) {
    changes.push({ field: "Joist size", from: project.joistSize ?? "—", to: joistSize });
  }
  if (project.joistSpacingIn != null && project.joistSpacingIn > MAX_JOIST_SPACING_IN) {
    changes.push({
      field: "Joist spacing",
      from: `${project.joistSpacingIn}" o.c.`,
      to: `${MAX_JOIST_SPACING_IN}" o.c.`,
    });
  }
  if ((project.spanConfiguration ?? "single_span") !== config) {
    changes.push({
      field: "Span configuration",
      from: project.spanConfiguration === "multi_span" ? "Multi-span" : "Single-span",
      to: config === "multi_span" ? "Multi-span — add an intermediate beam line" : "Single-span",
    });
  }
  if (project.joistSpanFt != null && project.joistSpanFt !== joistSpanFt) {
    changes.push({
      field: "Joist span",
      from: `${project.joistSpanFt} ft`,
      to: `${round(joistSpanFt)} ft between supports`,
    });
  }
  if (project.beamSize !== row.beamSize) {
    changes.push({ field: "Beam", from: project.beamSize ?? "—", to: row.beamSize });
  }
  if (project.beamSpanFt != null && project.beamSpanFt > row.maxSpanFt) {
    changes.push({
      field: "Post spacing",
      from: `${project.beamSpanFt} ft`,
      to: `${row.maxSpanFt} ft or less`,
    });
  }
  if (project.footingDiameterIn != null && project.footingDiameterIn < footing.minDiameterIn) {
    changes.push({
      field: "Footing diameter",
      from: `${project.footingDiameterIn}"`,
      to: `${footing.minDiameterIn}"`,
    });
  }
  if (project.footingDepthIn != null && project.footingDepthIn < L.footingMinDepthIn) {
    changes.push({
      field: "Footing depth",
      from: `${project.footingDepthIn}"`,
      to: `${L.footingMinDepthIn}" below grade`,
    });
  }
  if (
    project.attachment === "ledger" &&
    project.ledgerBoltSpacingIn != null &&
    project.ledgerBoltSpacingIn > row.ledgerBoltSpacingIn
  ) {
    changes.push({
      field: "Ledger bolts",
      from: `${project.ledgerBoltSpacingIn}" o.c.`,
      to: `${row.ledgerBoltSpacingIn}" o.c.`,
    });
  }
  if (project.postSize && posts.length > 0 && !posts.includes(project.postSize)) {
    changes.push({ field: "Post size", from: project.postSize, to: posts.join(" or ") });
  }

  return {
    joistSize,
    joistSpacingIn: MAX_JOIST_SPACING_IN,
    spanConfiguration: config,
    joistSpanFt: round(joistSpanFt),
    joistSpanMaxFt: CINCINNATI_JOIST_SPANS[joistSize],
    beamSize: row.beamSize,
    postSpacingMaxFt: row.maxSpanFt,
    footing,
    ledgerBoltSpacingIn: row.ledgerBoltSpacingIn,
    allowedPostSizes: posts,
    changes,
    isCurrent: changes.length === 0,
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Every table-legal framing configuration that covers this deck's joist run,
 * ranked by how little has to change.
 *
 * Returns the best option per (span configuration, joist size) so the list reads
 * as genuinely different approaches rather than ten variations on one.
 */
export function solveFraming(project: DeckProject, limit = 6): FramingOption[] {
  const totalRun = totalJoistRunFt(project);
  if (totalRun == null || totalRun <= 0) return [];

  const best = new Map<string, FramingOption>();

  for (const config of CONFIGS) {
    const spans = config === "multi_span" ? 2 : 1;
    const perSpan = totalRun / spans;

    for (const joistSize of JOIST_SIZES) {
      if (CINCINNATI_JOIST_SPANS[joistSize] < perSpan) continue;

      for (const row of beamOptionsFor(joistSize)) {
        const option = buildOption(project, config, joistSize, row, perSpan);
        const key = `${config}-${joistSize}`;
        const incumbent = best.get(key);
        if (
          !incumbent ||
          option.changes.length < incumbent.changes.length ||
          (option.changes.length === incumbent.changes.length &&
            BEAM_WEIGHT[option.beamSize] < BEAM_WEIGHT[incumbent.beamSize])
        ) {
          best.set(key, option);
        }
      }
    }
  }

  return [...best.values()]
    .sort(
      (a, b) =>
        a.changes.length - b.changes.length ||
        JOIST_WEIGHT[a.joistSize] - JOIST_WEIGHT[b.joistSize] ||
        BEAM_WEIGHT[a.beamSize] - BEAM_WEIGHT[b.beamSize] ||
        b.postSpacingMaxFt - a.postSpacingMaxFt,
    )
    .slice(0, limit);
}

/* ------------------------------------------------------------------ Tier 1 */

export interface Tier1Options {
  areaSqFt: number;
  qualifies: boolean;
  /** Square feet to come off to get under the threshold. */
  reduceBySqFt: number;
  /** Dimension pairs that keep the other side fixed and land under 400. */
  suggestions: { lengthFt: number; widthFt: number; areaSqFt: number }[];
}

/**
 * What it would take to get this deck under Cincinnati's 400 sq ft same-day
 * review threshold. Trimming a foot off a deck is often a cheaper trade than
 * three extra weeks in the standard queue — but only the contractor can make
 * that call, so the solver shows the arithmetic rather than recommending.
 */
export function solveTier1(project: DeckProject): Tier1Options | undefined {
  const area = deckAreaSqFt(project);
  if (area == null || project.deckLength == null || project.deckWidth == null) return undefined;

  if (area < TIER_1_MAX_AREA_SQFT) {
    return { areaSqFt: area, qualifies: true, reduceBySqFt: 0, suggestions: [] };
  }

  const { deckLength: len, deckWidth: wid } = project;
  const suggestions: Tier1Options["suggestions"] = [];

  // Trim one dimension at a time, to the nearest foot that lands under the cap.
  const maxLen = Math.floor((TIER_1_MAX_AREA_SQFT - 1) / wid);
  if (maxLen > 0 && maxLen < len) {
    suggestions.push({ lengthFt: maxLen, widthFt: wid, areaSqFt: maxLen * wid });
  }
  const maxWid = Math.floor((TIER_1_MAX_AREA_SQFT - 1) / len);
  if (maxWid > 0 && maxWid < wid) {
    suggestions.push({ lengthFt: len, widthFt: maxWid, areaSqFt: len * maxWid });
  }

  return {
    areaSqFt: area,
    qualifies: false,
    reduceBySqFt: area - (TIER_1_MAX_AREA_SQFT - 1),
    suggestions,
  };
}

/* ------------------------------------------------------------------- apply */

/**
 * Apply an option to a project, returning a new project. Used by the "use this
 * option" action, and by the tests that round-trip every option the solver
 * offers back through the engine — a solver that proposes a failing
 * configuration would be worse than no solver at all.
 */
export function applyOption(project: DeckProject, option: FramingOption): DeckProject {
  const postSize =
    option.allowedPostSizes.length > 0 &&
    (project.postSize == null || !option.allowedPostSizes.includes(project.postSize))
      ? option.allowedPostSizes[option.allowedPostSizes.length - 1]
      : project.postSize;

  return {
    ...project,
    joistSize: option.joistSize,
    joistSpacingIn: MAX_JOIST_SPACING_IN,
    spanConfiguration: option.spanConfiguration,
    joistSpanFt: option.joistSpanFt,
    beamSize: option.beamSize,
    beamSpanFt: Math.min(project.beamSpanFt ?? option.postSpacingMaxFt, option.postSpacingMaxFt),
    footingDiameterIn: Math.max(project.footingDiameterIn ?? 0, option.footing.minDiameterIn),
    footingThicknessIn: Math.max(project.footingThicknessIn ?? 0, option.footing.minThicknessIn),
    footingDepthIn: Math.max(project.footingDepthIn ?? 0, L.footingMinDepthIn),
    ledgerBoltSpacingIn:
      project.attachment === "ledger"
        ? Math.min(project.ledgerBoltSpacingIn ?? option.ledgerBoltSpacingIn, option.ledgerBoltSpacingIn)
        : project.ledgerBoltSpacingIn,
    postSize,
  };
}
