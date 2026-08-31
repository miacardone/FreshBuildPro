/**
 * Core types for the FreshBuild Pro compliance engine.
 *
 * Design constraints (non-negotiable, see docs/ENGINE.md):
 *  - Deterministic. The same project in gives the same findings out. No model calls.
 *  - Every rule points at a primary source. No source, no rule.
 *  - When a rule's threshold has not been confirmed against that source, the engine
 *    says "needs confirmation" rather than asserting a pass or a fail.
 */

/** Whether a rule's threshold has been checked against its primary source by a human. */
export type Confidence =
  /** Threshold read off the cited source and confirmed. Engine may assert pass/fail. */
  | "verified"
  /** Rule shape is encoded but the number has not been confirmed. Engine must not assert. */
  | "needs_confirmation";

export type Severity =
  /** Will be rejected. Cannot submit like this. */
  | "blocker"
  /** Likely to draw a correction from the plan examiner. */
  | "correction"
  /** Engine cannot make the call yet — a human must confirm against the source. */
  | "confirm"
  /** Nothing wrong. Context worth knowing about this jurisdiction. */
  | "info";

export interface Source {
  id: string;
  jurisdiction: string;
  /** Document title exactly as the city publishes it. */
  title: string;
  /** Sheet, table, or note within the document. */
  locator?: string;
  url: string;
  /** Edition or revision date printed on the document itself. */
  edition?: string;
  /** ISO date a human last checked the encoded rules against this document. */
  lastVerified: string;
  /** How often this source must be re-checked, in days. */
  recheckEveryDays: number;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  /** What is wrong, in the contractor's words. */
  title: string;
  /** Why it matters — what happens at plan review if this stands. */
  why: string;
  /** The next step. Always actionable. */
  fix: string;
  sourceId: string;
  /** What the project says. */
  observed?: string;
  /** What the code requires. */
  required?: string;
}

export interface RuleContext {
  /** Emit a finding. */
  flag: (f: Omit<Finding, "ruleId" | "sourceId">) => void;
  /** Emit a finding the engine is not certain about. Forces severity "confirm". */
  needsConfirmation: (f: Omit<Finding, "ruleId" | "sourceId" | "severity">) => void;
}

export interface Rule<P = DeckProject> {
  id: string;
  jurisdiction: string;
  trade: string;
  /** Short name a contractor would recognize. */
  title: string;
  category: RuleCategory;
  sourceId: string;
  confidence: Confidence;
  /** ISO date this rule was last edited. */
  encodedOn: string;
  /** Skip the rule entirely when it does not apply to this job. */
  appliesTo?: (project: P) => boolean;
  /** Run the check. Emit findings through ctx. Must be pure. */
  check: (project: P, ctx: RuleContext) => void;
}

export type RuleCategory =
  | "framing"
  | "attachment"
  | "footings"
  | "guards"
  | "stairs"
  | "lateral"
  | "materials"
  | "submission";

/** One rule's outcome in a single evaluation. Kept for the audit trail. */
export interface RuleRun {
  ruleId: string;
  applied: boolean;
  tripped: boolean;
  findingCount: number;
}

export interface Evaluation {
  projectId: string;
  jurisdiction: string;
  trade: string;
  /** ISO timestamp. */
  ranAt: string;
  /** Version of the rule set that produced this result. */
  ruleSetVersion: string;
  findings: Finding[];
  /** Every rule the engine considered, whether or not it tripped. */
  runs: RuleRun[];
  readiness: Readiness;
}

export interface Readiness {
  score: number;
  status: "not_ready" | "needs_work" | "ready";
  label: string;
  blockers: number;
  corrections: number;
  confirmations: number;
  missingFields: string[];
}

/* --------------------------------------------------------------------------
 * The deck project. Plain fields — no CAD, no drafting.
 * ----------------------------------------------------------------------- */

export type JoistSize = "2x6" | "2x8" | "2x10" | "2x12";
export type JoistSpacing = 12 | 16 | 24;
export type PostSize = "4x4" | "6x6";
export type Attachment = "ledger" | "freestanding";
export type WallCladding = "wood_siding" | "vinyl_siding" | "brick_veneer" | "stucco" | "fiber_cement";

export interface DeckProject {
  id: string;
  name: string;
  clientName?: string;
  address: string;
  jurisdiction: string;
  trade: "deck";
  createdAt: string;
  updatedAt: string;

  /** Overall footprint, feet. */
  deckLength?: number;
  deckWidth?: number;
  /** Walking surface to grade at the highest point, inches. */
  deckHeightIn?: number;

  joistSize?: JoistSize;
  joistSpacingIn?: JoistSpacing;
  /** Clear span between supports, feet. */
  joistSpanFt?: number;

  beamSpanFt?: number;
  postSize?: PostSize;
  postSpacingFt?: number;

  footingDiameterIn?: number;
  footingDepthIn?: number;

  attachment?: Attachment;
  wallCladding?: WallCladding;

  guardHeightIn?: number;
  guardOpeningIn?: number;

  hasStairs?: boolean;
  stairRisers?: number;
  riserHeightIn?: number;
  treadDepthIn?: number;
  stairWidthIn?: number;
  hasHandrail?: boolean;

  hasCornerBracing?: boolean;

  notes?: string;
}
