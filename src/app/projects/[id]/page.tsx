import Link from "next/link";
import { loadProject } from "@/lib/project-view";
import { TIER_META } from "@/components/status-badge";
import { SEVERITY_META } from "@/components/severity";
import { getRuleSet } from "@/lib/engine/jurisdictions";
import { TIER_1_HOURS, deckAreaSqFt } from "@/lib/rules/cincinnati/permit";

export const dynamic = "force-dynamic";

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`mt-1 text-xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

export default async function OverviewPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { project, evaluation } = await loadProject(id);
  const { readiness } = evaluation;
  const area = deckAreaSqFt(project);
  const ruleSet = getRuleSet(project.jurisdiction, project.trade);
  const applied = evaluation.runs.filter((r) => r.applied).length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Blockers" value={readiness.blockers} tone="text-blocker" />
        <Metric label="Warnings" value={readiness.warnings} tone="text-warning" />
        <Metric label="To confirm" value={readiness.confirmations} tone="text-confirm" />
        <Metric label="Advisories" value={readiness.advisories} tone="text-advisory" />
        <Metric label="Confirmed" value={evaluation.confirmed.length} tone="text-ok" />
      </div>

      {/* Review path — the thing a contractor most wants to know after "will it pass" */}
      <section className="card p-5">
        <div className="eyebrow">Review path</div>
        <h2 className="serif mt-1 text-lg font-bold">{TIER_META[evaluation.reviewTier].label}</h2>
        {evaluation.reviewTier === "tier_1" ? (
          <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">
            At {area} sq ft this deck is under Cincinnati&apos;s 400 sq ft threshold, so a complete
            package is reviewed the same day rather than going into the standard queue —{" "}
            {TIER_1_HOURS}.
          </p>
        ) : evaluation.reviewTier === "tier_2_or_3" ? (
          <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">
            At {area} sq ft this deck is at or over the 400 sq ft Tier 1 limit, so it goes to review
            by appointment or standard review. Worth knowing before you promise the client a date.
          </p>
        ) : (
          <p className="mt-1.5 text-[13px] text-ink-muted">
            Enter the deck length and width and the engine can tell you which review path this lands
            in.
          </p>
        )}
      </section>

      {readiness.missingFields.length > 0 && (
        <section className="card border-blocker/30 bg-blocker-soft p-5">
          <div className="eyebrow text-blocker">Still needed for a permit package</div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            {readiness.missingFields.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
          <Link
            href={`/projects/${id}/intake`}
            className="mt-3 inline-block rounded bg-blocker px-3 py-1.5 text-[12px] font-semibold text-white"
          >
            Complete the intake
          </Link>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <div className="eyebrow">Top issues</div>
            <Link href={`/projects/${id}/issues`} className="text-[12px] font-medium text-gold hover:underline">
              All {evaluation.findings.length} →
            </Link>
          </div>
          <ul className="mt-3 grid gap-2">
            {evaluation.findings
              .filter((f) => f.severity !== "advisory")
              .slice(0, 5)
              .map((f, i) => (
                <li key={`${f.ruleId}-${i}`} className="flex items-start gap-2.5 text-[13px]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_META[f.severity].bar}`} />
                  <span className="min-w-0">{f.title}</span>
                </li>
              ))}
            {evaluation.findings.filter((f) => f.severity !== "advisory").length === 0 && (
              <li className="text-[13px] text-ink-muted">
                Nothing tripped —{" "}
                <Link href={`/projects/${id}/issues`} className="font-medium text-gold hover:underline">
                  see the {evaluation.confirmed.length} checks the engine confirmed
                </Link>
                .
              </li>
            )}
          </ul>
        </section>

        <section className="card p-5">
          <div className="eyebrow">This check</div>
          <dl className="mt-2.5 grid gap-1.5 text-[12px]">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Run at</dt>
              <dd className="font-mono">{new Date(evaluation.ranAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Rule set</dt>
              <dd className="font-mono">{evaluation.ruleSetVersion}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Rules applied</dt>
              <dd className="font-mono">
                {applied} of {ruleSet.rules.length}
              </dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-muted">
            Deterministic: the same job entered gives the same answer every time. No model is
            involved in any finding on this page.
          </p>
        </section>
      </div>
    </div>
  );
}
