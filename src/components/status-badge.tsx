import type { ProjectStatus, Readiness, ReviewTier } from "@/lib/engine/types";

export const STATUS_META: Record<ProjectStatus, { text: string; chip: string; accent: string }> = {
  ready: { text: "Ready for Submission", chip: "bg-ok text-white", accent: "text-ok" },
  needs_work: { text: "Needs Work", chip: "bg-warning text-white", accent: "text-warning" },
  blocked: { text: "Blocked", chip: "bg-blocker text-white", accent: "text-blocker" },
  engineering_review: { text: "Engineering Review", chip: "bg-gold text-white", accent: "text-gold" },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${s.chip}`}>
      {s.text}
    </span>
  );
}

export const TIER_META: Record<ReviewTier, { label: string; detail: string }> = {
  tier_1: { label: "Tier 1 — Same-Day Review", detail: "Under 400 sq ft" },
  tier_2_or_3: { label: "Tier 2 / 3 Review", detail: "400 sq ft or over" },
  unknown: { label: "Review tier unknown", detail: "Enter the deck size" },
};

/** Readiness bar used in the project hero. */
export function ReadinessBar({ readiness }: { readiness: Readiness }) {
  const s = STATUS_META[readiness.status];
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/15">
        <div
          className={`h-full rounded-full ${readiness.status === "ready" ? "bg-ok" : readiness.status === "needs_work" ? "bg-warning" : "bg-blocker"}`}
          style={{ width: `${readiness.score}%` }}
        />
      </div>
      <span className={`text-xs font-semibold ${s.accent}`}>{readiness.score}% ready</span>
      {readiness.blockers > 0 && (
        <span className="rounded bg-blocker px-2 py-0.5 text-[11px] font-semibold text-white">
          {readiness.blockers} blocker{readiness.blockers === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
