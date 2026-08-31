import { allRuleSets, jurisdictionName } from "@/lib/engine/jurisdictions";
import { SOURCES, getSource, isPastDue } from "@/lib/rules/sources";
import {
  CINCINNATI_JOIST_SPANS,
  CINCINNATI_SPECIES_NOTE,
  spanTableCoverage,
} from "@/lib/rules/cincinnati/deck-tables";
import type { JoistSize, JoistSpacing } from "@/lib/engine/types";

export const dynamic = "force-dynamic";

const CONFIDENCE = {
  verified: { label: "Verified", cls: "bg-ok-soft text-ok border-ok/20" },
  needs_confirmation: { label: "Needs confirmation", cls: "bg-confirm-soft text-confirm border-confirm/20" },
} as const;

const SIZES: JoistSize[] = ["2x6", "2x8", "2x10", "2x12"];
const SPACINGS: JoistSpacing[] = [12, 16, 24];

export default function RulesPage() {
  const sets = allRuleSets();
  const coverage = spanTableCoverage();

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">The encoded rule set</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Every rule is cited and version-dated. A rule marked{" "}
          <em>needs confirmation</em> has its shape encoded but its number not yet read off the
          city&apos;s own document — so the engine reports it instead of calling it. That is
          deliberate: a wrong number that reads as confirmed is the one failure this product
          cannot have.
        </p>
      </div>

      {/* Sources and their re-check schedule */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide">Primary sources</h2>
        <ul className="grid gap-3">
          {Object.values(SOURCES).map((s) => {
            const due = isPastDue(s);
            return (
              <li key={s.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand hover:underline">
                    {s.title}
                  </a>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      due ? "border-correction/20 bg-correction-soft text-correction" : "border-border bg-surface-muted text-muted"
                    }`}
                  >
                    {due ? "Re-check past due" : `Re-checks every ${s.recheckEveryDays} days`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">{s.locator}</p>
                <p className="mt-1 text-xs text-muted">
                  Edition: {s.edition} · Last verified {s.lastVerified}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The span table itself */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide">Cincinnati joist span table</h2>
          <span className="text-xs text-muted">
            {coverage.verified} of {coverage.total} cells confirmed against the sheet
          </span>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Joist</th>
                {SPACINGS.map((s) => (
                  <th key={s} className="px-4 py-3 font-semibold">
                    {s}&quot; o.c.
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIZES.map((size) => (
                <tr key={size} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono font-semibold">{size}</td>
                  {SPACINGS.map((spacing) => {
                    const cell = CINCINNATI_JOIST_SPANS[size][spacing];
                    return (
                      <td key={spacing} className="px-4 py-3">
                        {cell.status === "verified" && cell.maxSpanFt != null ? (
                          <span className="font-mono font-semibold text-ok">{cell.maxSpanFt} ft</span>
                        ) : (
                          <span className="text-xs text-muted">not confirmed</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          No species column — and that is the point. General Note 2 on the city&apos;s drawing set
          already settles species at <strong>{CINCINNATI_SPECIES_NOTE.requirement}</strong>, so
          Cincinnati never asks. Generic span calculators ask, then answer off a table that does not
          govern here.
        </p>
      </section>

      {/* The rules */}
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
                      {source.title}
                    </a>
                    {source.locator ? ` — ${source.locator}` : ""} · encoded {rule.encodedOn}
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
