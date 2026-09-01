import { ACCEPTED_FILE_TYPES, allRuleSets, jurisdictionName } from "@/lib/engine/jurisdictions";
import { SOURCES, getSource, isPastDue } from "@/lib/rules/sources";
import { TIER_1_MAX_AREA_SQFT } from "@/lib/rules/cincinnati/permit";
import {
  CINCINNATI_BEAM_OPTIONS,
  CINCINNATI_JOIST_SPANS,
  CINCINNATI_SPECIES,
  MAX_JOIST_SPACING_IN,
  POST_SIZE_BY_HEIGHT,
} from "@/lib/rules/cincinnati/deck-tables";
import type { JoistSize } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

const CONFIDENCE = {
  verified: { label: "Verified", cls: "bg-ok text-white" },
  needs_confirmation: { label: "Needs confirmation", cls: "bg-confirm text-white" },
} as const;

const SIZES: JoistSize[] = ["2x6", "2x8", "2x10", "2x12"];

export default function RulesPage() {
  const sets = allRuleSets();
  const allRules = sets.flatMap((s) => s.rules);
  const verified = allRules.filter((r) => r.confidence === "verified").length;
  const lastVerified = Object.values(SOURCES)
    .map((s) => s.lastVerified)
    .sort()
    .at(-1);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="serif text-2xl font-bold tracking-tight">Rules &amp; Jurisdictions</h1>
      <p className="mt-1 text-[13px] text-ink-muted">
        Read-only view of active jurisdictions and their rule sets.
      </p>

      {/* Jurisdiction header */}
      <div className="card mt-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-bold">City of Cincinnati, Ohio</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">
              Supported · Tier 1 max {TIER_1_MAX_AREA_SQFT} sq ft · {verified} of {allRules.length} rules
              verified · Last verified {lastVerified}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ACCEPTED_FILE_TYPES.map((t) => (
              <span
                key={t}
                className="rounded bg-surface-muted px-2 py-1 font-mono text-[11px] font-semibold text-ink-muted"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-3 max-w-3xl border-t border-line pt-3 text-[12px] text-ink-muted">
          A rule marked <em>needs confirmation</em> has its shape encoded but its number not yet read
          off a primary source — so the engine reports it instead of calling it. That is deliberate:
          a wrong number that reads as confirmed is the one failure this product cannot have.
        </p>
      </div>

      {/* Sources */}
      <h2 className="eyebrow mt-8 mb-3">Primary sources</h2>
      <ul className="grid gap-2">
        {Object.values(SOURCES).map((s) => {
          const due = isPastDue(s);
          return (
            <li key={s.id} className="card px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-semibold text-gold hover:underline"
                >
                  {s.locator}
                </a>
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                    due ? "bg-warning text-white" : "bg-surface-muted text-ink-muted"
                  }`}
                >
                  {due ? "Re-check past due" : `Every ${s.recheckEveryDays} days`}
                </span>
              </div>
              <p className="mt-0.5 text-[11.5px] text-ink-muted">
                {s.title} · {s.edition} · verified {s.lastVerified}
              </p>
            </li>
          );
        })}
      </ul>

      {/* Framing table */}
      <h2 className="eyebrow mt-8 mb-1">Cincinnati Framing / Footing Table</h2>
      <p className="mb-3 max-w-3xl text-[12px] text-ink-muted">
        Transcribed from Sheet 1 of 5. Note what the table does <em>not</em> have: no species column,
        because General Note 2 settles it at {CINCINNATI_SPECIES}; and no spacing column, because
        table note (a) fixes every row at {MAX_JOIST_SPACING_IN}&quot; o.c. maximum. A tool that asks
        you for either is answering off a table that does not govern here.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[50rem] text-[12px]">
          <thead>
            <tr className="border-b border-line text-left text-[10.5px] uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-2 font-semibold">Joist</th>
              <th className="px-3 py-2 font-semibold">Span [A]</th>
              <th className="px-3 py-2 font-semibold">Beam</th>
              <th className="px-3 py-2 font-semibold">Span [B]</th>
              <th className="px-3 py-2 font-semibold">Footing single-span</th>
              <th className="px-3 py-2 font-semibold">Footing multi-span</th>
              <th className="px-3 py-2 font-semibold">Ledger bolts</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {SIZES.map((size) => {
              const rows = CINCINNATI_BEAM_OPTIONS.filter((b) => b.joistSize === size);
              return rows.map((row, i) => (
                <tr key={`${size}-${row.beamSize}`} className="border-b border-line last:border-0">
                  {i === 0 && (
                    <>
                      <td rowSpan={rows.length} className="border-r border-line px-3 py-2 align-top font-semibold">
                        {size}
                      </td>
                      <td
                        rowSpan={rows.length}
                        className="border-r border-line px-3 py-2 align-top font-semibold text-ok"
                      >
                        {CINCINNATI_JOIST_SPANS[size]} ft
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2">{row.beamSize}</td>
                  <td className="px-3 py-2 font-semibold">{row.maxSpanFt} ft</td>
                  <td className="px-3 py-2">
                    {row.footingSingleSpan.minDiameterIn}&quot; / {row.footingSingleSpan.minThicknessIn}&quot;
                  </td>
                  <td className="px-3 py-2">
                    {row.footingMultiSpan.minDiameterIn}&quot; / {row.footingMultiSpan.minThicknessIn}&quot;
                  </td>
                  <td className="px-3 py-2">{row.ledgerBoltSpacingIn}&quot; o.c.</td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Post size */}
      <h2 className="eyebrow mt-8 mb-3">Post size by deck height — General Note 17</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <tbody>
            {POST_SIZE_BY_HEIGHT.map((band) => (
              <tr key={band.label} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-medium">{band.label}</td>
                <td className="px-4 py-2.5 font-mono text-[12px]">{band.allowed.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-ink-muted">
        The city allows 4x4 posts up to 8 ft. A tool that insists on 6x6 everywhere is inventing a
        requirement and costing the contractor material.
      </p>

      {/* The rules */}
      {sets.map((set) => (
        <section key={`${set.jurisdiction}-${set.trade}`} className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="eyebrow">
              {jurisdictionName(set.jurisdiction)} — {set.trade} rule set
            </h2>
            <span className="font-mono text-[11px] text-ink-muted">v{set.version}</span>
          </div>
          <ul className="grid gap-2">
            {set.rules.map((rule) => {
              const source = getSource(rule.sourceId);
              const c = CONFIDENCE[rule.confidence];
              return (
                <li key={rule.id} className="card px-4 py-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <code className="font-mono text-[11.5px] font-semibold text-ink-muted">{rule.code}</code>
                        <h3 className="text-[13px] font-bold">{rule.title}</h3>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-[11.5px] font-medium text-gold hover:underline"
                      >
                        Source →
                      </a>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>{c.label}</span>
                      <span className="text-[10.5px] uppercase tracking-wide text-ink-muted">
                        Encoded {rule.encodedOn} · {rule.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
