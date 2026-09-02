import { Block, Sheet, Spec } from "@/components/documents/sheet";
import { getSource } from "@/lib/rules/sources";
import { ACCEPTED_FILE_TYPES } from "@/lib/engine/jurisdictions";
import {
  DECK_SUBMISSION_FORMS,
  TIER_1_HOURS,
  TIER_1_MAX_AREA_SQFT,
  deckAreaSqFt,
} from "@/lib/rules/cincinnati/permit";
import {
  CINCINNATI_DECK_LIMITS as L,
  CINCINNATI_JOIST_SPANS,
  CINCINNATI_SPECIES,
  MAX_JOIST_SPACING_IN,
  POST_SIZE_BY_HEIGHT,
  findBeamOption,
} from "@/lib/rules/cincinnati/deck-tables";
import { SEVERITY_META } from "@/components/severity";
import type { DeckProject, Evaluation } from "@/lib/engine/types";

export interface DocProps {
  project: DeckProject;
  evaluation: Evaluation;
}

const inches = (n?: number) => (n == null ? undefined : `${n}"`);
const feet = (n?: number) => (n == null ? undefined : `${n} ft`);

const CLADDING_DETAIL: Record<string, string> = {
  siding: "Siding Applications",
  brick_veneer: "Brick Veneer Applications",
  brick_block: "Brick/Block Applications",
  concrete: "Concrete Applications",
};

const TIER_LABEL = {
  tier_1: "Tier 1 — same-day review",
  tier_2_or_3: "Tier 2 or 3 — by appointment or standard review",
  unknown: "Not determined — deck size not entered",
} as const;

/* ------------------------------------------------------------------ 1. Cover */

export function CoverSheet({ project, evaluation }: DocProps) {
  const area = deckAreaSqFt(project);
  return (
    <Sheet
      project={project}
      title="Permit Application Cover Sheet"
      subtitle="Residential deck — City of Cincinnati"
    >
      <Block title="Scope of work">
        <Spec
          items={[
            { label: "Work", value: "New residential deck" },
            {
              label: "Attachment",
              value:
                project.attachment === "ledger"
                  ? "Attached to house by ledger"
                  : project.attachment === "freestanding"
                    ? "Freestanding"
                    : undefined,
            },
            { label: "Deck length", value: feet(project.deckLength) },
            { label: "Deck width", value: feet(project.deckWidth) },
            { label: "Deck area", value: area != null ? `${area} sq ft` : undefined },
            {
              label: "Height above grade",
              value: inches(project.deckHeightIn),
              note: "at the highest point",
            },
            { label: "Stairs", value: project.hasStairs ? `Yes — ${project.stairRisers ?? "?"} risers` : "No" },
            { label: "Hot tub or spa", value: project.hasHotTub ? "Yes" : "No" },
          ]}
        />
      </Block>

      <Block title="Review path">
        <Spec
          items={[
            { label: "Review tier", value: TIER_LABEL[evaluation.reviewTier] },
            { label: "Tier 1 threshold", value: `Under ${TIER_1_MAX_AREA_SQFT} sq ft` },
            ...(evaluation.reviewTier === "tier_1"
              ? [{ label: "Tier 1 hours", value: TIER_1_HOURS }]
              : []),
          ]}
        />
      </Block>

      <Block title="Property constraints">
        <Spec
          items={[
            {
              label: "Historic designation",
              value: project.inHistoricDistrict ? "Yes — Certificate of Appropriateness required first" : "No",
            },
            { label: "Floodplain", value: project.inFloodplain ? "Yes" : "No" },
            { label: "Electrical scope", value: project.hasElectrical ? "Yes — separate permit" : "No" },
            { label: "Plumbing scope", value: project.hasPlumbing ? "Yes — separate permit" : "No" },
            { label: "Mechanical scope", value: project.hasMechanical ? "Yes — separate permit" : "No" },
          ]}
        />
      </Block>

      <Block title="Pre-submission check">
        <Spec
          items={[
            { label: "Readiness", value: `${evaluation.readiness.score}% — ${evaluation.readiness.label}` },
            { label: "Blockers", value: String(evaluation.readiness.blockers) },
            { label: "Warnings", value: String(evaluation.readiness.warnings) },
            { label: "Checks confirmed", value: String(evaluation.confirmed.length) },
            { label: "Rule set", value: evaluation.ruleSetVersion },
            { label: "Checked", value: new Date(evaluation.ranAt).toLocaleString() },
          ]}
        />
      </Block>

      <Block title="Signatures">
        <div className="grid gap-6 pt-2 text-[11px] sm:grid-cols-3">
          {["Property Owner", "Person Completing this Form", "Contractor"].map((role) => (
            <div key={role}>
              <div className="font-semibold">{role}</div>
              {["Name", "Address", "Phone"].map((f) => (
                <div key={f} className="mt-3 border-b border-ink pb-0.5 text-[10px] text-ink-muted">
                  {f}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Block>
    </Sheet>
  );
}

/* ------------------------------------------------- 2. Deck plan specification */

export function DeckPlanSheet({ project, evaluation }: DocProps) {
  const source = getSource("cin-deck-sheet1");
  const band =
    project.deckHeightIn != null
      ? POST_SIZE_BY_HEIGHT.find((b) => project.deckHeightIn! / 12 <= b.maxHeightFt)
      : undefined;

  /** The numbered blanks on the city's five sheets, in their order. */
  const steps: { n: string; sheet: string; question: string; answer?: string; byHand?: boolean }[] = [
    {
      n: "1",
      sheet: "1",
      question: "Choose one floor joist size with the associated span",
      answer:
        project.joistSize && project.joistSpanFt != null
          ? `${project.joistSize} at ${project.joistSpanFt} ft (table allows ${CINCINNATI_JOIST_SPANS[project.joistSize]} ft)`
          : undefined,
    },
    {
      n: "2",
      sheet: "1",
      question: "Choose one floor beam — the entire row applies",
      answer: project.beamSize && project.beamSpanFt != null ? `${project.beamSize} at ${project.beamSpanFt} ft` : undefined,
    },
    {
      n: "3",
      sheet: "1",
      question: "Choose one beam-to-post connection option",
      byHand: true,
    },
    {
      n: "4",
      sheet: "1",
      question: "Choose one post size based on the height of the deck",
      answer: project.postSize && band ? `${project.postSize} — ${band.label} allows ${band.allowed.join(", ")}` : undefined,
    },
    {
      n: "5",
      sheet: "2",
      question: "Choose one span configuration",
      answer:
        project.spanConfiguration === "multi_span"
          ? "Multi-span"
          : project.spanConfiguration === "single_span"
            ? "Single-span"
            : undefined,
    },
    { n: "6", sheet: "2", question: "Fill in this over-all deck dimension", answer: feet(project.deckLength) },
    { n: "7", sheet: "2", question: "Fill in this over-all deck dimension", answer: feet(project.deckWidth) },
    {
      n: "8",
      sheet: "2",
      question: `Fill in the stair width, in inches (${L.stairMinWidthIn}" min.)`,
      answer: project.hasStairs ? inches(project.stairWidthIn) : "No stairs on this deck",
    },
    {
      n: "9",
      sheet: "2",
      question: 'Required footing diameter, "C" dimension',
      answer: inches(project.footingDiameterIn),
    },
    { n: "10", sheet: "2", question: "Choose a footing option", byHand: true },
    {
      n: "11",
      sheet: "3",
      question: "Fill in the highest point above grade, in inches",
      answer: inches(project.deckHeightIn),
    },
    { n: "12", sheet: "3", question: "Choose a handrail grip style", byHand: true },
    {
      n: "13",
      sheet: "4",
      question: 'Required footing depth, "D" dimension',
      answer: inches(project.footingDepthIn),
    },
    {
      n: "14",
      sheet: "4",
      question: "Choose the ledger board detail that applies",
      answer:
        project.attachment === "freestanding"
          ? "Freestanding — no ledger"
          : project.wallCladding
            ? CLADDING_DETAIL[project.wallCladding]
            : undefined,
    },
  ];

  return (
    <Sheet
      project={project}
      title="Deck Plan Specification"
      subtitle="Answers to every numbered blank on the city's Residential Deck Drawings, taken from this job"
    >
      <p className="mb-5 text-[11px] leading-relaxed text-ink-muted">
        Transcribe these onto the city&apos;s own sheets. Three of the blanks are choices made on the
        drawing itself rather than values this app holds — they are marked below so nothing gets
        missed.
      </p>

      <table className="w-full text-[11.5px]">
        <thead>
          <tr className="border-b border-ink text-left uppercase tracking-wide">
            <th className="w-8 py-1.5 font-bold">#</th>
            <th className="w-12 py-1.5 font-bold">Sheet</th>
            <th className="py-1.5 font-bold">The city asks</th>
            <th className="py-1.5 text-right font-bold">This job</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => (
            <tr key={s.n} className="border-b border-dotted border-line align-top">
              <td className="py-2 font-mono font-bold">[{s.n}]</td>
              <td className="py-2 font-mono text-ink-muted">{s.sheet} of 5</td>
              <td className="py-2 pr-3">{s.question}</td>
              <td className="py-2 text-right">
                {s.byHand ? (
                  <span className="italic text-ink-muted">choose on the sheet</span>
                ) : s.answer ? (
                  <span className="font-mono font-semibold">{s.answer}</span>
                ) : (
                  <span className="italic text-ink-muted">not entered</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Block title="Also required on the plan">
        <ul className="grid gap-1 text-[11.5px]">
          <li>· Lumber species is not asked for — General Note 2 sets it at {CINCINNATI_SPECIES}.</li>
          <li>· All joists spaced a maximum of {MAX_JOIST_SPACING_IN}&quot; o.c.</li>
          <li>· 2x4 diagonal brace at the bottom of the joists — required on all decks, in all areas.</li>
          {project.deckHeightIn != null && project.deckHeightIn / 12 > L.diagonalBracingRequiredAboveGradeFt && (
            <li>· 6x6 diagonal bracing at all posts — this deck is over 10 ft above grade.</li>
          )}
          <li>· 1/2&quot; bolts, staggered, at the ledger.</li>
        </ul>
      </Block>

      <p className="text-[10px] text-ink-muted">
        Source: {source.title} — {source.locator}. Verified {source.lastVerified}. Rule set{" "}
        {evaluation.ruleSetVersion}.
      </p>
    </Sheet>
  );
}

/* --------------------------------------------- 3. Framing & footing schedule */

export function FramingScheduleSheet({ project, evaluation }: DocProps) {
  const source = getSource("cin-deck-sheet1");
  const row = project.joistSize && project.beamSize ? findBeamOption(project.joistSize, project.beamSize) : undefined;
  const single = project.spanConfiguration === "single_span";
  const footing = row ? (single ? row.footingSingleSpan : row.footingMultiSpan) : undefined;

  return (
    <Sheet
      project={project}
      title="Framing & Footing Schedule"
      subtitle="The row of the city's Framing/Footing Table that governs this deck"
    >
      {!row ? (
        <p className="text-[12px] italic text-ink-muted">
          A joist size and beam size are needed before the governing table row can be identified.
          Enter them on the Intake tab.
        </p>
      ) : (
        <>
          <Block title="Governing table row">
            <Spec
              items={[
                { label: "Joist size", value: project.joistSize },
                { label: "Joist spacing", value: `${MAX_JOIST_SPACING_IN}" o.c. maximum` },
                {
                  label: "Joist span [A]",
                  value: feet(project.joistSpanFt),
                  note: `table maximum ${CINCINNATI_JOIST_SPANS[project.joistSize!]} ft`,
                },
                { label: "Beam size", value: row.beamSize },
                {
                  label: "Beam span [B]",
                  value: feet(project.beamSpanFt),
                  note: `table maximum ${row.maxSpanFt} ft`,
                },
                {
                  label: "Span configuration",
                  value: project.spanConfiguration ? (single ? "Single-span" : "Multi-span") : undefined,
                },
              ]}
            />
          </Block>

          <Block title={`Footings — ${single ? "single-span" : "multi-span"} column`}>
            <Spec
              items={[
                {
                  label: "Minimum diameter [C]",
                  value: footing ? `${footing.minDiameterIn}"` : undefined,
                  note: project.footingDiameterIn != null ? `specified ${project.footingDiameterIn}"` : undefined,
                },
                {
                  label: "Dimension [D]",
                  value: footing ? `${footing.minThicknessIn}"` : undefined,
                  note: "Sheet 1 heads this column min. thick; Sheet 4 calls [D] the footing depth — confirm with the examiner",
                },
                {
                  label: "Depth below grade",
                  value: inches(project.footingDepthIn),
                  note: `${L.footingMinDepthIn}" minimum`,
                },
                { label: "Concrete", value: "3000 psi min., cast in place", note: "General Note 4" },
              ]}
            />
          </Block>

          <Block title="Ledger">
            <Spec
              items={[
                {
                  label: "1/2\" bolt spacing",
                  value: `${row.ledgerBoltSpacingIn}" o.c.`,
                  note: "staggered — General Note 1",
                },
                {
                  label: "Detail to show",
                  value:
                    project.attachment === "freestanding"
                      ? "Freestanding — no ledger"
                      : project.wallCladding
                        ? CLADDING_DETAIL[project.wallCladding]
                        : undefined,
                  note: "Sheet 4 of 5",
                },
                { label: "Ledger board size", value: "Same size as deck joist, minimum" },
              ]}
            />
          </Block>

          <Block title="Materials">
            <Spec
              items={[
                { label: "Species and grade", value: CINCINNATI_SPECIES, note: "General Note 2" },
                { label: "Treatment", value: "Pressure treated for exterior use", note: "General Note 1" },
                { label: "Fasteners and hangers", value: "G185 galvanized or stainless", note: "General Note 1" },
                { label: "Decking", value: '5/4" thick minimum', note: "Sheet 2" },
              ]}
            />
          </Block>
        </>
      )}

      <p className="text-[10px] text-ink-muted">
        Source: {source.title} — {source.locator}. Verified {source.lastVerified}. Rule set{" "}
        {evaluation.ruleSetVersion}.
      </p>
    </Sheet>
  );
}

/* ------------------------------------------------------- 4. Site plan worksheet */

export function SitePlanSheet({ project }: DocProps) {
  const area = deckAreaSqFt(project);
  return (
    <Sheet
      project={project}
      title="Site Plan Worksheet"
      subtitle="What Cincinnati requires shown on the site plan — Sheet 5 of the city's deck set"
    >
      <Block title="Known from this job">
        <Spec
          items={[
            { label: "Project address", value: project.address || undefined },
            { label: "Proposed deck", value: project.deckLength && project.deckWidth ? `${project.deckLength} ft × ${project.deckWidth} ft` : undefined },
            { label: "Deck area", value: area != null ? `${area} sq ft` : undefined },
            { label: "Height above grade", value: inches(project.deckHeightIn), note: "at the highest point" },
            { label: "Property owner", value: project.clientName || undefined },
          ]}
        />
      </Block>

      <Block title="Must be drawn or measured on site">
        <ul className="grid gap-1.5 text-[11.5px]">
          {[
            "Property lines, with dimensions",
            "All existing structures on the lot",
            "The proposed deck, dimensioned and located",
            "Distance from the house to the proposed deck",
            "Distance from the deck to each property line",
            "Deck height above grade at all four corners",
            "North arrow",
            "Curb line and street centerline, with the street name",
            "House number",
            "Index of documents, with all sheet numbers",
            "Names and addresses of the owner, contractor, and whoever prepared the drawings",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[3px] inline-block h-3 w-3 shrink-0 border border-ink" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Not checked by this engine">
        <p className="text-[11.5px] leading-relaxed">
          Setbacks, lot coverage and rear-yard encroachment are a separate zoning review, and
          FreshBuild Pro does not evaluate them. The city also notes that walk-through review is not
          offered where an in-depth zoning review is needed. Confirm the setbacks against this lot
          before submitting — a deck framed perfectly to the table can still be refused on placement.
        </p>
      </Block>
    </Sheet>
  );
}

/* --------------------------------------------------------- 5. Compliance report */

export function ComplianceReportSheet({ project, evaluation }: DocProps) {
  const order = ["blocker", "warning", "confirm", "advisory"] as const;
  return (
    <Sheet
      project={project}
      title="Compliance Report"
      subtitle="Every check this job was run through, and the source behind each one"
    >
      <Block title="Result">
        <Spec
          items={[
            { label: "Readiness", value: `${evaluation.readiness.score}%` },
            { label: "Status", value: evaluation.readiness.label },
            { label: "Blockers", value: String(evaluation.readiness.blockers) },
            { label: "Warnings", value: String(evaluation.readiness.warnings) },
            { label: "Needs confirmation", value: String(evaluation.readiness.confirmations) },
            { label: "Checks confirmed", value: String(evaluation.confirmed.length) },
            { label: "Rules applied", value: String(evaluation.runs.filter((r) => r.applied).length) },
            { label: "Rule set version", value: evaluation.ruleSetVersion },
          ]}
        />
        {evaluation.readiness.missingFields.length > 0 && (
          <p className="mt-3 text-[11.5px]">
            <strong>Still needed for a permit package:</strong>{" "}
            {evaluation.readiness.missingFields.join(", ")}.
          </p>
        )}
      </Block>

      {order.map((severity) => {
        const items = evaluation.findings.filter((f) => f.severity === severity);
        if (items.length === 0) return null;
        return (
          <Block key={severity} title={`${SEVERITY_META[severity].label} — ${items.length}`}>
            <ul className="grid gap-3">
              {items.map((f, i) => {
                const source = getSource(f.sourceId);
                return (
                  <li key={`${f.ruleId}-${i}`} className="break-inside-avoid text-[11.5px]">
                    <div className="font-bold">{f.title}</div>
                    {(f.observed || f.required) && (
                      <div className="mt-0.5 font-mono text-[10.5px] text-ink-muted">
                        {f.observed && <>This job: {f.observed}</>}
                        {f.observed && f.required && " · "}
                        {f.required && <>Code: {f.required}</>}
                      </div>
                    )}
                    <div className="mt-1">
                      <span className="font-semibold">Why: </span>
                      {f.why}
                    </div>
                    <div>
                      <span className="font-semibold">Next step: </span>
                      {f.fix}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ink-muted">
                      {source.title} — {source.locator} (verified {source.lastVerified})
                    </div>
                  </li>
                );
              })}
            </ul>
          </Block>
        );
      })}

      {evaluation.confirmed.length > 0 && (
        <Block title={`Confirmed — ${evaluation.confirmed.length}`}>
          <ul className="grid gap-1 text-[11.5px]">
            {evaluation.confirmed.map((c, i) => {
              const source = getSource(c.sourceId);
              return (
                <li key={`${c.ruleId}-${i}`} className="flex gap-2 border-b border-dotted border-line pb-1">
                  <span aria-hidden>✓</span>
                  <span className="flex-1">{c.title}</span>
                  <span className="text-right font-mono text-[10px] text-ink-muted">
                    {c.required ?? ""} · {source.locator?.split("—")[0]?.trim()}
                  </span>
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      <p className="text-[10px] leading-relaxed text-ink-muted">
        Produced by a deterministic rules engine — the same job entered gives the same result every
        time, and no part of this report is generated by a model. Checked{" "}
        {new Date(evaluation.ranAt).toLocaleString()}.
      </p>
    </Sheet>
  );
}

/* ------------------------------------------------------ 6. Submission checklist */

export function SubmissionChecklistSheet({ project, evaluation }: DocProps) {
  const conditional = [
    project.inHistoricDistrict && "Certificate of Appropriateness — Urban Conservator (required before work starts)",
    project.hasElectrical && "Separate electrical permit",
    project.hasPlumbing && "Separate plumbing permit",
    project.hasMechanical && "Separate mechanical permit",
  ].filter(Boolean) as string[];

  return (
    <Sheet
      project={project}
      title="Submission Checklist"
      subtitle="Everything that goes in the envelope for this job"
    >
      {evaluation.readiness.blockers > 0 && (
        <div className="mb-6 border-2 border-ink p-3 text-[11.5px]">
          <strong>
            {evaluation.readiness.blockers} blocker{evaluation.readiness.blockers === 1 ? "" : "s"} outstanding.
          </strong>{" "}
          This job is not ready to submit. See the Compliance Report.
        </div>
      )}

      <Block title="Required documents">
        <ul className="grid gap-1.5 text-[11.5px]">
          {DECK_SUBMISSION_FORMS.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-[3px] inline-block h-3 w-3 shrink-0 border border-ink" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Block>

      {conditional.length > 0 && (
        <Block title="Pulled in by this job's scope">
          <ul className="grid gap-1.5 text-[11.5px]">
            {conditional.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-[3px] inline-block h-3 w-3 shrink-0 border border-ink" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      <Block title="Before you go">
        <ul className="grid gap-1.5 text-[11.5px]">
          {[
            "Every blocker cleared on the Compliance Report",
            "City deck sheets filled in from the Deck Plan Specification",
            "Site plan drawn, with setbacks confirmed against the lot",
            "Plans drawn to scale and showing all detail of the proposed work",
          ].map((c) => (
            <li key={c} className="flex gap-2">
              <span className="mt-[3px] inline-block h-3 w-3 shrink-0 border border-ink" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Filing">
        <Spec
          items={[
            { label: "Review path", value: TIER_LABEL[evaluation.reviewTier] },
            ...(evaluation.reviewTier === "tier_1" ? [{ label: "Tier 1 hours", value: TIER_1_HOURS }] : []),
            { label: "Accepted file types", value: ACCEPTED_FILE_TYPES.join(", ") },
          ]}
        />
      </Block>
    </Sheet>
  );
}
