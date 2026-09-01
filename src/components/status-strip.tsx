import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";

/**
 * The black strip across the top: the whole book of work at a glance, on every
 * page. If something is blocked, the contractor sees it without navigating.
 */
export async function StatusStrip() {
  const projects = await store.list();
  const results = projects.map(evaluateSafe);

  let blocked = 0;
  let ready = 0;
  let unresolved = 0;
  for (const r of results) {
    if (!r.ok) continue;
    const { readiness } = r.evaluation;
    if (readiness.status === "blocked" || readiness.status === "engineering_review") blocked++;
    if (readiness.status === "ready") ready++;
    unresolved += readiness.blockers;
  }

  return (
    <div className="flex items-center gap-6 border-b border-rail-line bg-strip px-8 py-2.5 text-[11px]">
      <span className="flex items-center gap-1.5 text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-blocker" />
        <strong className="font-semibold text-white">{blocked}</strong> blocked
      </span>
      <span className="text-white/20">|</span>
      <span className="flex items-center gap-1.5 text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        <strong className="font-semibold text-white">{ready}</strong> ready for submission
      </span>
      <span className="text-white/20">|</span>
      <span className="flex items-center gap-1.5 text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        <strong className="font-semibold text-white">{unresolved}</strong> unresolved blockers
      </span>
      <span className="ml-auto text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/70">
        Fresh Look Construction
      </span>
    </div>
  );
}
