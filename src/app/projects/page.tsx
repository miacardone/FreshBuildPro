import Link from "next/link";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { jurisdictionName } from "@/lib/engine/jurisdictions";
import { StatusBadge, TIER_META } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await store.list();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="serif text-2xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Every job checked against the city&apos;s own rules before anything is submitted.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-[13px] font-semibold">No projects yet.</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Enter a job in plain fields — no CAD, no drafting — and the engine checks it.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-block rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white"
          >
            Start a project
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {projects.map((p) => {
            const result = evaluateSafe(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="card block px-5 py-4 transition hover:border-gold/40 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[14px] font-semibold">{p.name}</h2>
                      <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                        {p.address} · {jurisdictionName(p.jurisdiction)}
                      </p>
                    </div>
                    {result.ok ? (
                      <div className="flex items-center gap-2">
                        {result.evaluation.reviewTier === "tier_1" && (
                          <span className="rounded border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">
                            Tier 1
                          </span>
                        )}
                        <StatusBadge status={result.evaluation.readiness.status} />
                      </div>
                    ) : (
                      <span className="rounded border border-line bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
                        City not covered
                      </span>
                    )}
                  </div>

                  {result.ok && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-muted">
                      <span>
                        Readiness <strong className="text-ink">{result.evaluation.readiness.score}%</strong>
                      </span>
                      <span>
                        <strong className="text-blocker">{result.evaluation.readiness.blockers}</strong> blocker(s)
                      </span>
                      <span>
                        <strong className="text-warning">{result.evaluation.readiness.warnings}</strong> warning(s)
                      </span>
                      <span>
                        <strong className="text-confirm">{result.evaluation.readiness.confirmations}</strong> to confirm
                      </span>
                      <span className="ml-auto">{TIER_META[result.evaluation.reviewTier].label}</span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
