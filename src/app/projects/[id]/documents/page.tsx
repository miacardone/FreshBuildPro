import { loadProject } from "@/lib/project-view";
import { ACCEPTED_FILE_TYPES } from "@/lib/engine/jurisdictions";
import { DECK_SUBMISSION_FORMS } from "@/lib/rules/cincinnati/permit";
import { getSource } from "@/lib/rules/sources";
import Link from "next/link";
import { DOCUMENTS } from "@/lib/documents/registry";

export const dynamic = "force-dynamic";

/**
 * What the city wants in the envelope. The generators that fill these in are the
 * next build — until they exist this tab says plainly what is needed and links
 * to the city's own forms rather than pretending to produce them.
 */
const DOCUMENT_NOTES: Record<string, string> = {
  "Building Application": "The permit application itself — owner, contractor, and scope.",
  "Site Plan":
    "Property lines and dimensions, existing and proposed structures, distance from house to deck, distance to property lines, north arrow, and deck height above grade at all corners. Sheet 5 of the city's deck set is a blank template for this.",
  "Deck Plan":
    "The city's own Residential Deck Drawings set, filled in — span configuration, deck dimensions, stair width, footing diameter and depth, beam-to-post connection, post size, ledger detail, and handrail grip style.",
  "Required Permit Documentation": "Whatever else the scope pulls in — trade permits, and a Certificate of Appropriateness on a historic property.",
};

export default async function DocumentsPage({ params }: PageProps<"/projects/[id]/documents">) {
  const { id } = await params;
  const { project } = await loadProject(id);
  const formsSource = getSource("cin-deck-permit-forms");
  const deckSet = getSource("cin-deck-sheet1");

  return (
    <div className="grid gap-5">
      <section className="card p-5">
        <div className="eyebrow">Submission package</div>
        <h2 className="serif mt-1 text-lg font-bold">What Cincinnati wants in the envelope</h2>
        <p className="mt-1.5 max-w-2xl text-[13px] text-ink-muted">
          Four documents, from the city&apos;s deck forms page. A missing one is a wasted trip to the
          permit center.
        </p>

        <ul className="mt-4 grid gap-2.5">
          {DECK_SUBMISSION_FORMS.map((form, i) => (
            <li key={form} className="flex gap-3 rounded border border-line px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-ink-muted">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{form}</div>
                <p className="mt-0.5 text-[12px] text-ink-muted">{DOCUMENT_NOTES[form]}</p>
              </div>
            </li>
          ))}
          {project.inHistoricDistrict && (
            <li className="flex gap-3 rounded border border-blocker/40 bg-blocker-soft px-4 py-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blocker text-[11px] font-bold text-white">
                !
              </span>
              <div>
                <div className="text-[13px] font-semibold">Certificate of Appropriateness</div>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  Required first on this property — it is historic-designated, and the Urban
                  Conservator runs on its own timeline.
                </p>
              </div>
            </li>
          )}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="eyebrow">Accepted file types</span>
          {ACCEPTED_FILE_TYPES.map((t) => (
            <span
              key={t}
              className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-muted"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[12px]">
          <a href={formsSource.url} target="_blank" rel="noreferrer" className="font-medium text-gold hover:underline">
            City deck forms page →
          </a>
          <a href={deckSet.url} target="_blank" rel="noreferrer" className="font-medium text-gold hover:underline">
            Residential Deck Drawings set →
          </a>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="eyebrow">Generated for this job</div>
            <h2 className="serif mt-1 text-lg font-bold">Permit documents</h2>
          </div>
          <span className="text-[12px] text-ink-muted">{DOCUMENTS.length} documents</span>
        </div>
        <p className="mb-4 max-w-3xl text-[13px] text-ink-muted">
          Built from this job&apos;s own data. These are contractor&apos;s worksheets, not city forms
          — you still fill in and submit Cincinnati&apos;s own sheets. What these do is answer every
          question those sheets ask, so filling them in is transcription instead of decisions. Each
          one prints to PDF from the browser.
        </p>

        <ul className="grid gap-3 sm:grid-cols-2">
          {DOCUMENTS.map((d) => (
            <li key={d.slug}>
              <Link
                href={`/projects/${id}/documents/${d.slug}`}
                className="card flex h-full flex-col p-4 transition hover:border-gold/50 hover:shadow-sm"
              >
                <h3 className="text-[13.5px] font-bold">{d.title}</h3>
                <p className="mt-1 flex-1 text-[12px] text-ink-muted">{d.purpose}</p>
                <p className="mt-2.5 border-t border-line pt-2 text-[11px] text-gold">
                  {d.goesWith} →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
