import Link from "next/link";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/stat-tile";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await store.list();
  const rows = projects.map((project) => ({ project, result: evaluateSafe(project) }));

  const ok = rows.filter((r) => r.result.ok);
  const counts = {
    active: projects.length,
    blocked: ok.filter((r) => r.result.ok && r.result.evaluation.readiness.status === "blocked").length,
    ready: ok.filter((r) => r.result.ok && r.result.evaluation.readiness.status === "ready").length,
    tier1: ok.filter((r) => r.result.ok && r.result.evaluation.reviewTier === "tier_1").length,
    engineering: ok.filter(
      (r) => r.result.ok && r.result.evaluation.readiness.status === "engineering_review",
    ).length,
  };

  const recent = rows.slice(0, 6);
  const revisions = (
    await Promise.all(projects.map(async (p) => (await store.evaluations(p.id)).map((e) => ({ p, e }))))
  )
    .flat()
    .sort((a, b) => b.e.ranAt.localeCompare(a.e.ranAt))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="serif text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Cincinnati residential deck permits — permit-readiness overview
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          + New Project
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Active Projects" value={counts.active} tone="neutral" icon="folder" />
        <StatTile label="Blocked" value={counts.blocked} tone="blocked" icon="alert" />
        <StatTile label="Ready for Submission" value={counts.ready} tone="ready" icon="check" />
        <StatTile label="Tier 1 Candidates" value={counts.tier1} tone="neutral" icon="bolt" />
        <StatTile label="Engineering Triggered" value={counts.engineering} tone="engineering" icon="stamp" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-[13px] font-bold">Recently Updated Projects</h2>
            <Link href="/projects" className="text-[12px] font-medium text-gold hover:underline">
              View all →
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-muted">
              No projects yet. Start one and the engine checks it on save.
            </p>
          ) : (
            <ul>
              {recent.map(({ project, result }) => (
                <li key={project.id} className="border-b border-line last:border-0">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-surface-muted"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold">{project.name}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">
                        {result.ok ? (
                          <>
                            Readiness {result.evaluation.readiness.score}% ·{" "}
                            {result.evaluation.readiness.blockers} blocker(s) ·{" "}
                            {result.evaluation.readiness.warnings} warning(s)
                          </>
                        ) : (
                          "City not covered"
                        )}
                      </div>
                    </div>
                    {result.ok && <StatusBadge status={result.evaluation.readiness.status} />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <header className="border-b border-line px-5 py-3">
            <h2 className="text-[13px] font-bold">Recent Revisions</h2>
          </header>
          {revisions.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-ink-muted">No revisions logged yet.</p>
          ) : (
            <ul>
              {revisions.map(({ p, e }) => (
                <li key={`${p.id}-${e.ranAt}`} className="border-b border-line px-5 py-3 last:border-0">
                  <Link href={`/projects/${p.id}/revisions`} className="block">
                    <div className="truncate text-[12px] font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-ink-muted">
                      {new Date(e.ranAt).toLocaleString()} · {e.readiness.score}% ·{" "}
                      {e.readiness.blockers} blocker(s)
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
