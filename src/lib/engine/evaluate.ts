import type {
  DeckProject,
  Evaluation,
  Finding,
  Readiness,
  ReviewTier,
  RuleContext,
  RuleRun,
  Severity,
} from "@/lib/engine/types";
import { getRuleSet } from "@/lib/engine/jurisdictions";
import { deckAreaSqFt, TIER_1_MAX_AREA_SQFT } from "@/lib/rules/cincinnati/permit";

/**
 * Fields a Cincinnati deck permit package cannot be assembled without.
 * Missing fields hold a job out of "ready" regardless of findings.
 */
const REQUIRED_FIELDS: { key: keyof DeckProject; label: string }[] = [
  { key: "address", label: "Job address" },
  { key: "deckLength", label: "Deck length" },
  { key: "deckWidth", label: "Deck width" },
  { key: "deckHeightIn", label: "Deck height above grade" },
  { key: "joistSize", label: "Joist size" },
  { key: "joistSpacingIn", label: "Joist spacing" },
  { key: "joistSpanFt", label: "Joist span" },
  { key: "spanConfiguration", label: "Single-span or multi-span" },
  { key: "beamSize", label: "Beam size" },
  { key: "beamSpanFt", label: "Beam span" },
  { key: "attachment", label: "Attachment (ledger or freestanding)" },
  { key: "postSize", label: "Post size" },
  { key: "footingDiameterIn", label: "Footing diameter" },
  { key: "footingDepthIn", label: "Footing depth" },
];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocker: 25,
  warning: 10,
  confirm: 3,
  advisory: 0,
};

export function missingRequiredFields(project: DeckProject): string[] {
  return REQUIRED_FIELDS.filter(({ key }) => {
    const v = project[key];
    return v === undefined || v === null || v === "";
  }).map((f) => f.label);
}

/**
 * Run every rule for the project's jurisdiction and trade.
 *
 * Deterministic: same project in, same evaluation out (apart from `ranAt`).
 * Throws UnsupportedJurisdictionError for a city/trade with no encoded rules —
 * the engine says so and stops rather than approximating.
 */
export function evaluate(project: DeckProject, now = new Date()): Evaluation {
  const ruleSet = getRuleSet(project.jurisdiction, project.trade);

  const findings: Finding[] = [];
  const runs: RuleRun[] = [];
  /** Set when a tripped rule puts the job outside the city's stock drawing set. */
  let escalate = false;

  for (const rule of ruleSet.rules) {
    const applies = rule.appliesTo ? rule.appliesTo(project) : true;
    if (!applies) {
      runs.push({ ruleId: rule.id, applied: false, tripped: false, findingCount: 0 });
      continue;
    }

    const emitted: Finding[] = [];
    const ctx: RuleContext = {
      flag: (f) => {
        // A rule whose threshold is unconfirmed may not assert a pass or a fail.
        const severity: Severity =
          rule.confidence === "needs_confirmation" && f.severity !== "advisory" ? "confirm" : f.severity;
        emitted.push({ ...f, severity, ruleId: rule.id, sourceId: rule.sourceId });
      },
      needsConfirmation: (f) => {
        emitted.push({ ...f, severity: "confirm", ruleId: rule.id, sourceId: rule.sourceId });
      },
    };

    rule.check(project, ctx);

    const tripped = emitted.some((f) => f.severity !== "advisory");
    if (tripped && rule.escalatesToEngineering) escalate = true;

    findings.push(...emitted);
    runs.push({
      ruleId: rule.id,
      applied: true,
      tripped,
      findingCount: emitted.length,
    });
  }

  const missing = missingRequiredFields(project);

  return {
    projectId: project.id,
    jurisdiction: project.jurisdiction,
    trade: project.trade,
    ranAt: now.toISOString(),
    ruleSetVersion: ruleSet.version,
    findings,
    runs,
    readiness: score(findings, missing, escalate),
    reviewTier: reviewTier(project),
  };
}

/**
 * Which review path the job lands in. Cincinnati reviews residential decks under
 * 400 sq ft same-day (Tier 1); at or over that they go to review by appointment
 * or standard review.
 */
export function reviewTier(project: DeckProject): ReviewTier {
  const area = deckAreaSqFt(project);
  if (area == null) return "unknown";
  return area < TIER_1_MAX_AREA_SQFT ? "tier_1" : "tier_2_or_3";
}

export function score(
  findings: Finding[],
  missingFields: string[],
  escalatesToEngineering = false,
): Readiness {
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;
  const confirmations = findings.filter((f) => f.severity === "confirm").length;
  const advisories = findings.filter((f) => f.severity === "advisory").length;

  let value = 100;
  value -= blockers * SEVERITY_WEIGHT.blocker;
  value -= warnings * SEVERITY_WEIGHT.warning;
  value -= confirmations * SEVERITY_WEIGHT.confirm;
  value -= missingFields.length * 5;
  const scoreValue = Math.max(0, Math.min(100, Math.round(value)));

  // The number is a summary, not the gate. A job is never "ready" while a
  // blocker stands or a required field is empty, whatever the score says.
  let status: Readiness["status"];
  let label: string;
  if (escalatesToEngineering) {
    status = "engineering_review";
    label = "Outside the city's stock drawing set — needs an engineer";
  } else if (blockers > 0) {
    status = "blocked";
    label = blockers === 1 ? "1 blocker to clear" : `${blockers} blockers to clear`;
  } else if (missingFields.length > 0) {
    status = "blocked";
    label = `${missingFields.length} required field${missingFields.length === 1 ? "" : "s"} missing`;
  } else if (warnings > 0 || confirmations > 0) {
    status = "needs_work";
    const parts = [];
    if (warnings) parts.push(`${warnings} warning${warnings === 1 ? "" : "s"}`);
    if (confirmations) parts.push(`${confirmations} to confirm`);
    label = parts.join(" · ");
  } else {
    status = "ready";
    label = "Clean against the encoded rule set";
  }

  return { score: scoreValue, status, label, blockers, warnings, confirmations, advisories, missingFields };
}
