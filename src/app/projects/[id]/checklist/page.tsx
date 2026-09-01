import { loadProject } from "@/lib/project-view";
import { DECK_SUBMISSION_FORMS, TIER_1_HOURS } from "@/lib/rules/cincinnati/permit";

export const dynamic = "force-dynamic";

type Item = { label: string; done: boolean; detail?: string; hard?: boolean };

function Row({ item }: { item: Item }) {
  return (
    <li className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-0">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold ${
          item.done ? "border-ok bg-ok text-white" : item.hard ? "border-blocker text-blocker" : "border-line text-transparent"
        }`}
        aria-hidden
      >
        ✓
      </span>
      <div className="min-w-0">
        <div className={`text-[13px] ${item.done ? "text-ink-muted line-through" : "font-medium"}`}>
          {item.label}
        </div>
        {item.detail && <p className="mt-0.5 text-[12px] text-ink-muted">{item.detail}</p>}
      </div>
    </li>
  );
}

export default async function ChecklistPage({ params }: PageProps<"/projects/[id]/checklist">) {
  const { id } = await params;
  const { project, evaluation } = await loadProject(id);
  const { readiness } = evaluation;

  const design: Item[] = [
    {
      label: "Every field a permit package needs is filled in",
      done: readiness.missingFields.length === 0,
      detail: readiness.missingFields.length ? `Still missing: ${readiness.missingFields.join(", ")}` : undefined,
      hard: true,
    },
    {
      label: "No blockers outstanding",
      done: readiness.blockers === 0,
      detail: readiness.blockers ? `${readiness.blockers} to clear on the Issues tab` : undefined,
      hard: true,
    },
    {
      label: "Warnings reviewed",
      done: readiness.warnings === 0,
      detail: readiness.warnings ? `${readiness.warnings} the examiner is likely to comment on` : undefined,
    },
    {
      label: "Items needing confirmation resolved",
      done: readiness.confirmations === 0,
      detail: readiness.confirmations
        ? `${readiness.confirmations} the engine will not call until confirmed against the source`
        : undefined,
    },
  ];

  const paperwork: Item[] = DECK_SUBMISSION_FORMS.map((form) => ({
    label: form,
    done: false,
    detail: "Assemble before the trip to the permit center",
  }));

  const conditional: Item[] = [
    ...(project.inHistoricDistrict
      ? [
          {
            label: "Certificate of Appropriateness from the Urban Conservator",
            done: false,
            detail: "Historic-designated property — this gates the building permit",
            hard: true,
          },
        ]
      : []),
    ...(project.hasElectrical ? [{ label: "Separate electrical permit", done: false }] : []),
    ...(project.hasPlumbing ? [{ label: "Separate plumbing permit", done: false }] : []),
    ...(project.hasMechanical ? [{ label: "Separate mechanical permit", done: false }] : []),
  ];

  return (
    <div className="grid gap-5">
      <section className="card overflow-hidden">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-[13px] font-bold">Design — what the engine checks</h2>
        </header>
        <ul>
          {design.map((i) => (
            <Row key={i.label} item={i} />
          ))}
        </ul>
      </section>

      <section className="card overflow-hidden">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-[13px] font-bold">Paperwork — what goes in the envelope</h2>
        </header>
        <ul>
          {paperwork.map((i) => (
            <Row key={i.label} item={i} />
          ))}
        </ul>
      </section>

      {conditional.length > 0 && (
        <section className="card overflow-hidden">
          <header className="border-b border-line px-4 py-3">
            <h2 className="text-[13px] font-bold">Pulled in by this job&apos;s scope</h2>
          </header>
          <ul>
            {conditional.map((i) => (
              <Row key={i.label} item={i} />
            ))}
          </ul>
        </section>
      )}

      {evaluation.reviewTier === "tier_1" && (
        <section className="card border-gold/40 bg-gold/5 p-5">
          <div className="eyebrow text-gold">Timing</div>
          <p className="mt-1 text-[13px]">
            This job qualifies for Tier 1 same-day review. Go with a complete package during Tier 1
            hours — {TIER_1_HOURS}.
          </p>
        </section>
      )}
    </div>
  );
}
