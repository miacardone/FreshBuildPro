import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { jurisdictionName, getRuleSet } from "@/lib/engine/jurisdictions";
import { getSource, isPastDue } from "@/lib/rules/sources";
import { ReadinessDial } from "@/components/readiness-badge";
import { SeverityChip, SEVERITY_META, SEVERITY_ORDER } from "@/components/severity";
import type { Finding, Severity } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

function FindingCard({ finding }: { finding: Finding }) {
  const source = getSource(finding.sourceId);
  const meta = SEVERITY_META[finding.severity];
  const pastDue = isPastDue(source);

  return (
    <li className="card overflow-hidden">
      <div className="flex">
        <div className={`w-1 shrink-0 ${meta.bar}`} aria-hidden />
        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug">{finding.title}</h3>
            <SeverityChip severity={finding.severity} />
          </div>

          {(finding.observed || finding.required) && (
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 rounded-md bg-surface-muted px-3 py-2 text-xs">
              {finding.observed && (
                <span>
                  <span className="text-muted">Your job: </span>
                  <span className="font-mono font-semibold">{finding.observed}</span>
                </span>
              )}
              {finding.required && (
                <span>
                  <span className="text-muted">Code: </span>
                  <span className="font-mono font-semibold">{finding.required}</span>
                </span>
              )}
            </div>
          )}

          <dl className="mt-3 grid gap-2 text-sm">
            <div>
              <dt className="inline text-xs font-semibold uppercase tracking-wide text-muted">Why it matters · </dt>
              <dd className="inline text-muted">{finding.why}</dd>
            </div>
            <div>
              <dt className="inline text-xs font-semibold uppercase tracking-wide text-muted">Next step · </dt>
              <dd className="inline font-medium">{finding.fix}</dd>
            </div>
          </dl>

          <div className="mt-3 border-t border-border pt-3 text-xs text-muted">
            <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
              {source.title}
            </a>
            {source.locator && <span> — {source.locator}</span>}
            <span className="ml-2 opacity-70">
              (verified {source.lastVerified}
              {pastDue ? " · re-check past due" : ""})
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const project = await store.get(id);
  if (!project) notFound();

  const result = evaluateSafe(project);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <div className="card mt-6 border-correction/30 bg-correction-soft p-6">
          <h2 className="text-sm font-bold text-correction">This city is not covered yet</h2>
          <p className="mt-2 text-sm">{result.message}</p>
          <p className="mt-3 text-xs text-muted">
            The engine will not approximate one city&apos;s rules with another&apos;s. Covering a new
            city means adding that city&apos;s rule set.
          </p>
        </div>
      </div>
    );
  }

  const { evaluation } = result;
  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    findings: evaluation.findings.filter((f) => f.severity === severity),
  })).filter((g) => g.findings.length > 0);

  const ruleSet = getRuleSet(project.jurisdiction, project.trade);
  const applied = evaluation.runs.filter((r) => r.applied);
  const tripped = evaluation.runs.filter((r) => r.tripped);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {project.address} · {jurisdictionName(project.jurisdiction)} · Residential deck
            </p>
          </div>
          <Link
            href={`/jobs/${project.id}/edit`}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold transition hover:border-brand/40"
          >
            Edit job
          </Link>
        </div>

        <div className="card mt-5 p-5">
          <ReadinessDial readiness={evaluation.readiness} />
          {evaluation.readiness.missingFields.length > 0 && (
            <div className="mt-4 rounded-md border border-border bg-surface-muted p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Still needed for a permit package
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {evaluation.readiness.missingFields.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <h2 className="mt-8 mb-3 text-sm font-bold uppercase tracking-wide">
          What the engine found
          <span className="ml-2 font-normal normal-case tracking-normal text-muted">
            {evaluation.findings.length} item{evaluation.findings.length === 1 ? "" : "s"}
          </span>
        </h2>

        {evaluation.findings.length === 0 ? (
          <div className="card p-8 text-center text-sm text-muted">
            Nothing tripped. Every applicable rule in the encoded set passed on this job.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.severity} className="mb-6">
              <p className="mb-2 text-xs font-semibold text-muted">
                {SEVERITY_META[group.severity as Severity].blurb}
              </p>
              <ul className="grid gap-3">
                {group.findings.map((f, i) => (
                  <FindingCard key={`${f.ruleId}-${i}`} finding={f} />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Audit trail — the engine records what ran, what tripped, and when. */}
      <aside className="grid h-fit gap-4 text-sm">
        <div className="card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">This check</h2>
          <dl className="mt-2 grid gap-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Run at</dt>
              <dd className="font-mono">{new Date(evaluation.ranAt).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Rule set</dt>
              <dd className="font-mono">{evaluation.ruleSetVersion}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Rules in set</dt>
              <dd className="font-mono">{ruleSet.rules.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Applied</dt>
              <dd className="font-mono">{applied.length}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">Tripped</dt>
              <dd className="font-mono">{tripped.length}</dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
            Deterministic: the same job entered gives the same answer every time. No model is
            involved in any finding on this page.
          </p>
        </div>

        <div className="card p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide">Rules that ran</h2>
          <ul className="mt-2 grid gap-1 text-[11px]">
            {evaluation.runs.map((r) => (
              <li key={r.ruleId} className="flex items-center justify-between gap-2">
                <span className={`font-mono ${r.applied ? "" : "text-muted line-through"}`}>{r.ruleId}</span>
                <span className={r.tripped ? "font-semibold text-correction" : "text-muted"}>
                  {!r.applied ? "n/a" : r.tripped ? "tripped" : "pass"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/rules" className="card p-4 transition hover:border-brand/40">
          <h2 className="text-xs font-bold uppercase tracking-wide">The encoded rule set</h2>
          <p className="mt-1 text-xs text-muted">
            Every rule, its source, and when it was last verified against that source.
          </p>
        </Link>
      </aside>
    </div>
  );
}
