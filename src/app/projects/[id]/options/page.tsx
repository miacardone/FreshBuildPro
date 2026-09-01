import Link from "next/link";
import { loadProject } from "@/lib/project-view";
import { solveFraming, solveTier1, totalJoistRunFt } from "@/lib/engine/solver";
import { applyFramingOption } from "@/app/projects/actions";
import { TIER_1_MAX_AREA_SQFT } from "@/lib/rules/cincinnati/permit";
import type { FramingOption } from "@/lib/engine/solver";

export const dynamic = "force-dynamic";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-0.5 font-mono text-[12.5px] font-semibold">{value}</div>
    </div>
  );
}

function OptionCard({
  option,
  index,
  projectId,
  rank,
}: {
  option: FramingOption;
  index: number;
  projectId: string;
  rank: number;
}) {
  const apply = applyFramingOption.bind(null, projectId, index);

  return (
    <li className={`card overflow-hidden ${option.isCurrent ? "border-ok/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-ink-muted">
            {rank}
          </span>
          <div>
            <h3 className="text-[14px] font-bold">
              {option.joistSize} joists at {option.joistSpacingIn}&quot; o.c.
              {option.spanConfiguration === "multi_span" ? " · multi-span" : " · single-span"}
            </h3>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              {option.joistSpanFt} ft between supports — the table allows {option.joistSpanMaxFt} ft for{" "}
              {option.joistSize}
            </p>
          </div>
        </div>
        {option.isCurrent ? (
          <span className="rounded bg-ok px-2 py-0.5 text-[11px] font-semibold text-white">
            What you have now
          </span>
        ) : (
          <span className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
            {option.changes.length} change{option.changes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <Spec label="Beam" value={option.beamSize} />
        <Spec label="Posts no more than" value={`${option.postSpacingMaxFt} ft apart`} />
        <Spec
          label="Footings"
          value={`${option.footing.minDiameterIn}" dia × ${option.footing.minThicknessIn}" [D]`}
        />
        <Spec
          label="Post size"
          value={option.allowedPostSizes.length ? option.allowedPostSizes.join(" / ") : "Enter deck height"}
        />
      </div>

      {option.changes.length > 0 && (
        <div className="border-t border-line bg-surface-muted px-5 py-4">
          <div className="eyebrow">What changes</div>
          <ul className="mt-2 grid gap-1.5">
            {option.changes.map((c) => (
              <li key={c.field} className="flex flex-wrap items-baseline gap-2 text-[12.5px]">
                <span className="font-semibold">{c.field}</span>
                <span className="font-mono text-ink-muted line-through">{c.from}</span>
                <span aria-hidden className="text-ink-muted">
                  →
                </span>
                <span className="font-mono font-semibold">{c.to}</span>
              </li>
            ))}
          </ul>
          <form action={apply} className="mt-4">
            <button
              type="submit"
              className="rounded bg-gold px-4 py-2 text-[12.5px] font-semibold text-white transition hover:brightness-110"
            >
              Use this option
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export default async function OptionsPage({ params }: PageProps<"/projects/[id]/options">) {
  const { id } = await params;
  const { project, evaluation } = await loadProject(id);

  const options = solveFraming(project);
  const tier1 = solveTier1(project);
  const run = totalJoistRunFt(project);

  return (
    <div className="grid gap-5">
      <section className="card p-5">
        <div className="eyebrow">Working backwards from the table</div>
        <h2 className="serif mt-1 text-lg font-bold">What would make this pass</h2>
        <p className="mt-1.5 max-w-3xl text-[13px] text-ink-muted">
          Every configuration below comes out of Cincinnati&apos;s own Framing/Footing Table — joist,
          beam, post spacing and footing sizes travel together as one row. Nothing here is
          calculated or estimated; if it is not on the city&apos;s sheet, it is not offered.
          {run != null && (
            <>
              {" "}
              Solved against a total joist run of <strong className="text-ink">{run} ft</strong> from the
              house to the outer beam.
            </>
          )}
        </p>
      </section>

      {options.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[13px] font-semibold">Nothing to solve yet.</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            Enter the joist span on the Intake tab and the solver can work the table backwards.
          </p>
          <Link
            href={`/projects/${id}/intake`}
            className="mt-4 inline-block rounded bg-gold px-4 py-2 text-[12.5px] font-semibold text-white"
          >
            Go to Intake
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {options.map((option, i) => (
            <OptionCard
              key={`${option.spanConfiguration}-${option.joistSize}`}
              option={option}
              index={i}
              projectId={id}
              rank={i + 1}
            />
          ))}
        </ul>
      )}

      {tier1 && !tier1.qualifies && (
        <section className="card border-gold/40 bg-gold/5 p-5">
          <div className="eyebrow text-gold">Same-day review</div>
          <h2 className="mt-1 text-[14px] font-bold">
            {tier1.reduceBySqFt} sq ft off this deck puts it back in Tier 1
          </h2>
          <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">
            At {tier1.areaSqFt} sq ft it is at or over the {TIER_1_MAX_AREA_SQFT} sq ft cap, so it goes
            into the standard queue. Whether trimming it is worth the weeks saved is the
            contractor&apos;s call — here is the arithmetic:
          </p>
          <ul className="mt-3 grid gap-1.5">
            {tier1.suggestions.map((s) => (
              <li key={`${s.lengthFt}x${s.widthFt}`} className="font-mono text-[12.5px]">
                {s.lengthFt} × {s.widthFt} = {s.areaSqFt} sq ft
              </li>
            ))}
          </ul>
        </section>
      )}

      {evaluation.readiness.blockers > 0 && (
        <p className="text-[12px] text-ink-muted">
          The solver covers framing, footings and the ledger. Guards, stairs and the property rules
          are on the{" "}
          <Link href={`/projects/${id}/issues`} className="font-medium text-gold hover:underline">
            Issues tab
          </Link>{" "}
          — it will not pretend to have solved those.
        </p>
      )}
    </div>
  );
}
