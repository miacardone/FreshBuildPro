import type { Readiness } from "@/lib/engine/types";

const STATUS = {
  ready: { text: "Ready to submit", chip: "bg-ok-soft text-ok border-ok/20", ring: "text-ok" },
  needs_work: {
    text: "Needs work",
    chip: "bg-correction-soft text-correction border-correction/20",
    ring: "text-correction",
  },
  not_ready: {
    text: "Not ready",
    chip: "bg-blocker-soft text-blocker border-blocker/20",
    ring: "text-blocker",
  },
} as const;

export function ReadinessBadge({ readiness }: { readiness: Readiness }) {
  const s = STATUS[readiness.status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${s.chip}`}>
      {s.text}
      <span className="opacity-60">·</span>
      <span className="tabular-nums">{readiness.score}</span>
    </span>
  );
}

/** Circular score dial for the job header. */
export function ReadinessDial({ readiness }: { readiness: Readiness }) {
  const s = STATUS[readiness.status];
  const r = 34;
  const c = 2 * Math.PI * r;
  const filled = (readiness.score / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 80 80" className={`h-20 w-20 -rotate-90 ${s.ring}`} aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <div>
        <div className="text-3xl font-bold tabular-nums leading-none">{readiness.score}</div>
        <div className="mt-1 text-sm font-semibold">{s.text}</div>
        <div className="text-xs text-muted">{readiness.label}</div>
      </div>
    </div>
  );
}
