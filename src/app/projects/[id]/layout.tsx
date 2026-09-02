import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { jurisdictionName } from "@/lib/engine/jurisdictions";
import { ProjectTabs } from "@/components/project-tabs";
import { ReadinessBar, StatusBadge, TIER_META } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[id]">) {
  const { id } = await params;
  const project = await store.get(id);
  if (!project) notFound();

  const result = evaluateSafe(project);

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/projects" className="text-[12px] text-gold hover:underline print:hidden">
        ← All projects
      </Link>

      <header className="mt-3 rounded-lg bg-rail px-6 py-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="serif text-xl font-bold tracking-tight text-gold-bright">{project.name}</h1>
            <p className="mt-1 text-[12px] text-rail-ink">
              {project.address} · {jurisdictionName(project.jurisdiction)}
            </p>
          </div>
          {result.ok && (
            <div className="flex flex-wrap items-center gap-2">
              {result.evaluation.reviewTier === "tier_1" && (
                <span className="rounded border border-gold/50 bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-bright">
                  {TIER_META.tier_1.label}
                </span>
              )}
              <StatusBadge status={result.evaluation.readiness.status} />
            </div>
          )}
        </div>
        {result.ok && (
          <div className="mt-4">
            <ReadinessBar readiness={result.evaluation.readiness} />
          </div>
        )}
      </header>

      {result.ok ? (
        <>
          <div className="mt-5 print:hidden">
            <ProjectTabs projectId={id} />
          </div>
          <div className="pt-5">{children}</div>
        </>
      ) : (
        <div className="card mt-5 border-warning/30 bg-warning-soft p-6">
          <h2 className="text-[13px] font-bold text-warning">This city is not covered yet</h2>
          <p className="mt-2 text-[13px]">{result.message}</p>
          <p className="mt-3 text-[12px] text-ink-muted">
            The engine will not approximate one city&apos;s rules with another&apos;s. Covering a new
            city means adding that city&apos;s rule set.
          </p>
        </div>
      )}
    </div>
  );
}
