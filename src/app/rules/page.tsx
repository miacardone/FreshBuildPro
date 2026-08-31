import { allRuleSets, jurisdictionName } from "@/lib/engine/jurisdictions";
import { SOURCES, getSource, isPastDue } from "@/lib/rules/sources";
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
  verified: { label: "Verified", cls: "bg-ok-soft text-ok border-ok/20" },
  needs_confirmation: { label: "Needs confirmation", cls: "bg-confirm-soft text-confirm border-confirm/20" },
} as const;

const SIZES: JoistSize[] = ["2x6", "2x8", "2x10", "2x12"];

export default function RulesPage() {
  const sets = allRuleSets();
  const allRules = sets.flatMap((s) => s.rules);
  const verifiedCount = allRules.filter((r) => r.confidence === "verified").length;

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">The encoded rule set</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Every rule is cited to the sheet it came from and version-dated.{" "}
          <strong className="text-foreground">
            {verifiedCount} of {allRules.length}
          </strong>{" "}
          are verified against the city&apos;s published drawing set. A rule marked{" "}
          <em>needs confirmation</em> has its shape encoded but its number unresolved — so the engine
          reports it instead of calling it.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Primary sources</h2>
        <ul className="grid gap-3">
          {Object.values(SOURCES).map((s) => {
            const due = isPastDue(s);
            return (
              <li key={s.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-brand hover:underline"
                  >
                    {s.locator}
                  </a>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      due
                        ? "border-correction/20 bg-correction-soft text-correction"
                        : "border-border bg-surface-muted text-muted"
                    }`}
                  >
                    {due ? "Re-check past due" : `Re-checks every ${s.recheckEveryDays} days`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {s.title} · {s.edition} · last verified {s.lastVerified}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The city's table, as transcribed */}
      <section>
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">
          Cincinnati Framing / Footing Table
        </h2>
        <p className="mb-3 max-w-3xl text-xs text-muted">
          Transcribed from Sheet 1 of 5. Note what the table does <em>not</em> have: no species
          column, because General Note 2 settles it at {CINCINNATI_SPECIES}; and no spacing column,
          because table note (a) fixes every row at {MAX_JOIST_SPACING_IN}&quot; o.c. maximum. A tool
          that asks you for either is answering off a table that does not govern here.
        </p>

        <div className="card overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="px-3 py-2 font-semibold">Joist</th>
                <th className="px-3 py-2 font-semibold">Span [A]</th>
                <th className="px-3 py-2 font-semibold">Beam</th>
                <th className="px-3 py-2 font-semibold">Span [B]</th>
                <th className="px-3 py-2 font-semibold">
                  Footing, single-span
                  <br />
                  <span className="font-normal normal-case">dia [C] / thick [D]</span>
                </th>
                <th className="px-3 py-2 font-semibold">
                  Footing, multi-span
                  <br />
                  <span className="font-normal normal-case">dia [C] / thick [D]</span>
                </th>
                <th className="px-3 py-2 font-semibold">
                  1/2&quot; ledger
                  <br />
                  <span className="font-normal normal-case">bolt spacing</span>
                </th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {SIZES.map((size) => {
                const rows = CINCINNATI_BEAM_OPTIONS.filter((b) => b.joistSize === size);
                return rows.map((row, i) => (
                  <tr key={`${size}-${row.beamSize}`} className="border-b border-border last:border-0">
                    {i === 0 && (
                      <>
                        <td
                          rowSpan={rows.length}
                          className="border-r border-border px-3 py-2 align-top font-semibold"
                        >
                          {size}
                        </td>
                        <td
                          rowSpan={rows.length}
                          className="border-r border-border px-3 py-2 align-top font-semibold text-ok"
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
        <p className="mt-2 text-xs text-muted">
          Table note (b): choose one floor beam row that corresponds with the joist size chosen — the
          entire row applies, footings and ledger bolts included.
        </p>
      </section>

      {/* Post size by height — General Note 17 */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">
          Post size by deck height — General Note 17
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {POST_SIZE_BY_HEIGHT.map((band) => (
                <tr key={band.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{band.label}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{band.allowed.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Worth noting: the city allows 4x4 posts up to 8 ft. A tool that insists on 6x6 everywhere is
          inventing a requirement and costing the contractor material.
        </p>
      </section>

      {sets.map((set) => (
        <section key={`${set.jurisdiction}-${set.trade}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {jurisdictionName(set.jurisdiction)} — {set.trade}
            </h2>
            <span className="font-mono text-xs text-muted">v{set.version}</span>
          </div>
          <ul className="grid gap-2">
            {set.rules.map((rule) => {
              const source = getSource(rule.sourceId);
              const c = CONFIDENCE[rule.confidence];
              return (
                <li key={rule.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{rule.title}</h3>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">{rule.id}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted">
                        {rule.category}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${c.cls}`}>
                        {c.label}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      {source.locator}
                    </a>{" "}
                    · encoded {rule.encodedOn}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
