import type { DeckProject } from "@/lib/engine/types";
import { jurisdictionName } from "@/lib/engine/jurisdictions";

/**
 * Shared chrome for a printable document. On screen it reads as a page on the
 * work surface; in print the app around it drops away and the sheet remains.
 */
export function Sheet({
  project,
  title,
  subtitle,
  children,
}: {
  project: DeckProject;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[8.5in] bg-white p-8 text-ink shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <header className="mb-6 border-b-2 border-ink pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="serif text-[17px] font-bold tracking-tight">FreshBuild Pro</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-ink-muted">
              Design. Comply. Build.
            </div>
          </div>
          <div className="text-right text-[11px] text-ink-muted">
            <div>FreshBuild LLC · Cincinnati, Ohio</div>
            <div>Prepared {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <h1 className="serif mt-5 text-[22px] font-bold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[12px] text-ink-muted">{subtitle}</p>}

        <dl className="mt-4 grid gap-x-8 gap-y-1 text-[12px] sm:grid-cols-2">
          <Row label="Project" value={project.name} />
          <Row label="Jurisdiction" value={jurisdictionName(project.jurisdiction)} />
          <Row label="Address" value={project.address || "—"} />
          <Row label="Client" value={project.clientName || "—"} />
        </dl>
      </header>

      {children}

      <footer className="mt-8 border-t border-line pt-3 text-[10px] leading-relaxed text-ink-muted">
        Prepared by FreshBuild Pro from the job data entered for this project. This is a
        contractor&apos;s worksheet — not a City of Cincinnati form, and not an approval. The
        city&apos;s own Residential Deck Drawings and permit application must still be completed and
        submitted. Every code reference cites the city document it was read from; confirm against
        the current published set before submitting.
      </footer>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-semibold">{label}:</dt>
      <dd className="min-w-0 truncate">{value}</dd>
    </div>
  );
}

/** A titled block within a sheet. */
export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 border-b border-line pb-1 text-[11px] font-bold uppercase tracking-[0.1em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Label/value rows, the workhorse of these sheets. */
export function Spec({
  items,
}: {
  items: { label: string; value?: string; note?: string }[];
}) {
  return (
    <dl className="grid gap-x-8 gap-y-1.5 text-[12px] sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label} className="flex justify-between gap-3 border-b border-dotted border-line pb-1">
          <dt className="text-ink-muted">{i.label}</dt>
          <dd className="text-right">
            <span className={i.value ? "font-mono font-semibold" : "italic text-ink-muted"}>
              {i.value ?? "not entered"}
            </span>
            {i.note && <span className="block text-[10px] text-ink-muted">{i.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
