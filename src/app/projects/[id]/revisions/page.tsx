import { store } from "@/lib/store";
import { loadProject } from "@/lib/project-view";
import { getRuleSet } from "@/lib/engine/jurisdictions";
import type { Evaluation } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

/** What changed between two consecutive runs — the point of keeping a history. */
function diff(previous: Evaluation | undefined, current: Evaluation) {
  if (!previous) return { resolved: [] as string[], introduced: [] as string[], scoreDelta: 0 };
  const was = new Set(previous.findings.filter((f) => f.severity !== "advisory").map((f) => f.ruleId));
  const now = new Set(current.findings.filter((f) => f.severity !== "advisory").map((f) => f.ruleId));
  return {
    resolved: [...was].filter((id) => !now.has(id)),
    introduced: [...now].filter((id) => !was.has(id)),
    scoreDelta: current.readiness.score - previous.readiness.score,
  };
}

export default async function RevisionsPage({ params }: PageProps<"/projects/[id]/revisions">) {
  const { id } = await params;
  const { project } = await loadProject(id);
  const history = await store.evaluations(id); // newest first
  const ruleSet = getRuleSet(project.jurisdiction, project.trade);
  const titleFor = new Map(ruleSet.rules.map((r) => [r.id, r.title]));

  if (history.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-[13px] font-semibold">No revisions logged yet.</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Every save records a run — the rule set version, what tripped, and what changed since the
          run before it.
        </p>
      </div>
    );
  }

  return (
    <ol className="grid gap-3">
      {history.map((evaluation, i) => {
        const previous = history[i + 1];
        const d = diff(previous, evaluation);
        return (
          <li key={evaluation.ranAt} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold">
                {new Date(evaluation.ranAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-2 text-[12px]">
                <span className="font-mono text-ink-muted">v{evaluation.ruleSetVersion}</span>
                <span className="font-bold tabular-nums">{evaluation.readiness.score}%</span>
                {previous && d.scoreDelta !== 0 && (
                  <span className={`font-semibold ${d.scoreDelta > 0 ? "text-ok" : "text-blocker"}`}>
                    {d.scoreDelta > 0 ? "+" : ""}
                    {d.scoreDelta}
                  </span>
                )}
              </span>
            </div>

            <div className="mt-1.5 text-[12px] text-ink-muted">
              {evaluation.readiness.blockers} blocker(s) · {evaluation.readiness.warnings} warning(s) ·{" "}
              {evaluation.readiness.confirmations} to confirm
            </div>

            {(d.resolved.length > 0 || d.introduced.length > 0) && (
              <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-[12px]">
                {d.resolved.map((ruleId) => (
                  <li key={`r-${ruleId}`} className="text-ok">
                    ✓ Cleared — {titleFor.get(ruleId) ?? ruleId}
                  </li>
                ))}
                {d.introduced.map((ruleId) => (
                  <li key={`i-${ruleId}`} className="text-blocker">
                    ✗ Introduced — {titleFor.get(ruleId) ?? ruleId}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
