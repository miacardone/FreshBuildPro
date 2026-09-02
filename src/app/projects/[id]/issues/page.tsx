import { loadProject } from "@/lib/project-view";
import { getSource, isPastDue } from "@/lib/rules/sources";
import { getRuleSet } from "@/lib/engine/jurisdictions";
import { SEVERITY_META, SEVERITY_ORDER, SeverityChip } from "@/components/severity";
import type { Finding } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

function Count({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="card flex items-center justify-between px-4 py-3">
      <span className="text-[13px] font-medium">{label}</span>
      <span className={`rounded px-2 py-0.5 text-[12px] font-bold text-white ${tone}`}>{value}</span>
    </div>
  );
}

function IssueCard({ finding, code }: { finding: Finding; code?: string }) {
  const source = getSource(finding.sourceId);
  const pastDue = isPastDue(source);

  return (
    <li className="card overflow-hidden">
      <div className="flex">
        <div className={`w-1 shrink-0 ${SEVERITY_META[finding.severity].bar}`} aria-hidden />
        <div className="min-w-0 flex-1 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[13.5px] font-bold leading-snug">{finding.title}</h3>
            <SeverityChip severity={finding.severity} />
          </div>
          {code && <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-ink-muted">{code}</p>}

          {(finding.observed || finding.required) && (
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 rounded bg-surface-muted px-3 py-2 text-[12px]">
              {finding.observed && (
                <span>
                  <span className="text-ink-muted">This job: </span>
                  <span className="font-mono font-semibold">{finding.observed}</span>
                </span>
              )}
              {finding.required && (
                <span>
                  <span className="text-ink-muted">Code: </span>
                  <span className="font-mono font-semibold">{finding.required}</span>
                </span>
              )}
            </div>
          )}

          <dl className="mt-3 grid gap-1.5 text-[13px]">
            <div>
              <dt className="inline font-bold">What&apos;s wrong: </dt>
              <dd className="inline text-ink-muted">{finding.why}</dd>
            </div>
            <div>
              <dt className="inline font-bold">Next step: </dt>
              <dd className="inline">{finding.fix}</dd>
            </div>
          </dl>

          <div className="mt-3 text-[11.5px]">
            <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-gold hover:underline">
              Source: {source.title} →
            </a>
            {source.locator && <span className="text-ink-muted"> · {source.locator}</span>}
            <span className="text-ink-muted">
              {" "}
              (verified {source.lastVerified}
              {pastDue ? " · re-check past due" : ""})
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export default async function IssuesPage({ params }: PageProps<"/projects/[id]/issues">) {
  const { id } = await params;
  const { project, evaluation } = await loadProject(id);
  const ruleSet = getRuleSet(project.jurisdiction, project.trade);
  const codeFor = new Map(ruleSet.rules.map((r) => [r.id, r.code]));

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    findings: evaluation.findings.filter((f) => f.severity === severity),
  })).filter((g) => g.findings.length > 0);

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Count label="Blockers" value={evaluation.readiness.blockers} tone="bg-blocker" />
        <Count label="Warnings" value={evaluation.readiness.warnings} tone="bg-warning" />
        <Count label="To confirm" value={evaluation.readiness.confirmations} tone="bg-confirm" />
        <Count label="Advisories" value={evaluation.readiness.advisories} tone="bg-advisory" />
        <Count label="Confirmed" value={evaluation.confirmed.length} tone="bg-ok" />
      </div>

      {evaluation.confirmed.length > 0 && (
        <section className="card overflow-hidden border-ok/30">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ok-soft px-5 py-3">
            <div>
              <h2 className="text-[13px] font-bold text-ok">
                Confirmed — {evaluation.confirmed.length} check
                {evaluation.confirmed.length === 1 ? "" : "s"} the engine agreed with
              </h2>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                What the engine checked and found right, and the number it checked against.
              </p>
            </div>
          </header>
          <ul>
            {evaluation.confirmed.map((c, i) => {
              const source = getSource(c.sourceId);
              return (
                <li
                  key={`${c.ruleId}-${i}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-5 py-3 last:border-0"
                >
                  <span aria-hidden className="text-[13px] font-bold text-ok">
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 text-[13px]">{c.title}</span>
                  {c.required && (
                    <span className="font-mono text-[11.5px] text-ink-muted">{c.required}</span>
                  )}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-[11px] font-medium text-gold hover:underline"
                  >
                    {codeFor.get(c.ruleId) ?? "Source"} →
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {evaluation.findings.length === 0 ? (
        <div className="card p-10 text-center text-[13px] text-ink-muted">
          Nothing tripped. Every applicable rule in the encoded set passed on this job — the
          confirmed checks above show what the engine agreed with, and why.
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.severity}>
            <p className="eyebrow mb-2">{SEVERITY_META[group.severity].blurb}</p>
            <ul className="grid gap-3">
              {group.findings.map((f, i) => (
                <IssueCard key={`${f.ruleId}-${i}`} finding={f} code={codeFor.get(f.ruleId)} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
