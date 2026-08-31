import type {
  DeckProject,
  Evaluation,
  Finding,
  Readiness,
  RuleContext,
  RuleRun,
  Severity,
} from "@/lib/engine/types";
import { getRuleSet } from "@/lib/engine/jurisdictions";

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
  { key: "attachment", label: "Attachment (ledger or freestanding)" },
  { key: "postSize", label: "Post size" },
  { key: "footingDepthIn", label: "Footing depth" },
];

const SEVERITY_WEIGHT: Record<Severity, number> = {
  blocker: 25,
  correction: 10,
  confirm: 3,
  info: 0,
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
          rule.confidence === "needs_confirmation" && f.severity !== "info" ? "confirm" : f.severity;
        emitted.push({ ...f, severity, ruleId: rule.id, sourceId: rule.sourceId });
      },
      needsConfirmation: (f) => {
        emitted.push({ ...f, severity: "confirm", ruleId: rule.id, sourceId: rule.sourceId });
      },
    };

    rule.check(project, ctx);

    findings.push(...emitted);
    runs.push({
      ruleId: rule.id,
      applied: true,
      tripped: emitted.some((f) => f.severity !== "info"),
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
    readiness: score(findings, missing),
  };
}

export function score(findings: Finding[], missingFields: string[]): Readiness {
  const blockers = findings.filter((f) => f.severity === "blocker").length;
  const corrections = findings.filter((f) => f.severity === "correction").length;
  const confirmations = findings.filter((f) => f.severity === "confirm").length;

  let value = 100;
  value -= blockers * SEVERITY_WEIGHT.blocker;
  value -= corrections * SEVERITY_WEIGHT.correction;
  value -= confirmations * SEVERITY_WEIGHT.confirm;
  value -= missingFields.length * 5;
  const scoreValue = Math.max(0, Math.min(100, Math.round(value)));

  // A job is never "ready" with a blocker or a missing field, whatever the number says.
  let status: Readiness["status"];
  let label: string;
  if (blockers > 0) {
    status = "not_ready";
    label = blockers === 1 ? "1 blocker to clear" : `${blockers} blockers to clear`;
  } else if (missingFields.length > 0) {
    status = "not_ready";
    label = `${missingFields.length} required field${missingFields.length === 1 ? "" : "s"} missing`;
  } else if (corrections > 0 || confirmations > 0) {
    status = "needs_work";
    const parts = [];
    if (corrections) parts.push(`${corrections} likely correction${corrections === 1 ? "" : "s"}`);
    if (confirmations) parts.push(`${confirmations} to confirm`);
    label = parts.join(" · ");
  } else {
    status = "ready";
    label = "Clean against the encoded rule set";
  }

  return { score: scoreValue, status, label, blockers, corrections, confirmations, missingFields };
}
