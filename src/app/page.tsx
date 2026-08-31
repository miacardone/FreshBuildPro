import Link from "next/link";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { jurisdictionName } from "@/lib/engine/jurisdictions";
import { ReadinessBadge } from "@/components/readiness-badge";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const projects = await store.list();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted">
            Every job checked against the city&apos;s own rules before anything is submitted.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          New job
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-medium">No jobs yet.</p>
          <p className="mt-1 text-sm text-muted">
            Enter a job in plain fields — no CAD, no drafting — and the engine checks it.
          </p>
          <Link
            href="/jobs/new"
            className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Start a job
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {projects.map((p) => {
            const result = evaluateSafe(p);
            return (
              <li key={p.id}>
                <Link
                  href={`/jobs/${p.id}`}
                  className="card block p-5 transition hover:border-brand/40 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{p.name}</h2>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {p.address} · {jurisdictionName(p.jurisdiction)} · {p.trade}
                      </p>
                    </div>
                    {result.ok ? (
                      <ReadinessBadge readiness={result.evaluation.readiness} />
                    ) : (
                      <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-muted">
                        City not covered
                      </span>
                    )}
                  </div>

                  {result.ok && (
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
                      <span>
                        <strong className="text-blocker">{result.evaluation.readiness.blockers}</strong> blockers
                      </span>
                      <span>
                        <strong className="text-correction">{result.evaluation.readiness.corrections}</strong> likely
                        corrections
                      </span>
                      <span>
                        <strong className="text-confirm">{result.evaluation.readiness.confirmations}</strong> to confirm
                      </span>
                      <span className="ml-auto">
                        {result.evaluation.runs.filter((r) => r.applied).length} rules ran
                      </span>
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
