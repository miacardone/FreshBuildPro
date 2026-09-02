/**
 * The permit-document set.
 *
 * These are FreshBuild Pro worksheets built from the job's own data. They are
 * not city forms and do not reproduce the city's drawing sheets — the
 * contractor still fills in and submits Cincinnati's own set. What these do is
 * answer, in one place, every question those sheets ask, so filling them in is
 * transcription instead of decision-making.
 *
 * Each renders as a print sheet: the app chrome drops out under @media print,
 * so Cmd+P gives a clean PDF with no extra dependency.
 */

export interface DocumentDefinition {
  slug: string;
  title: string;
  /** One line on what it is for. */
  purpose: string;
  /** Where it goes in the city's submission. */
  goesWith: string;
}

export const DOCUMENTS: DocumentDefinition[] = [
  {
    slug: "cover",
    title: "Permit Application Cover Sheet",
    purpose: "Job identity, owner and contractor, scope, and the review path this job lands in.",
    goesWith: "Front of the package, with the Building Application",
  },
  {
    slug: "deck-plan",
    title: "Deck Plan Specification",
    purpose:
      "Every numbered blank on the city's 5-sheet deck set, answered from this job — so filling in their sheets is transcription, not decisions.",
    goesWith: "Worksheet for the city's Deck Plan sheets",
  },
  {
    slug: "framing-schedule",
    title: "Framing & Footing Schedule",
    purpose:
      "The one row of the city's Framing/Footing Table that governs this deck — joist, beam, footings and ledger bolts, which travel together.",
    goesWith: "Supports the Deck Plan",
  },
  {
    slug: "site-plan",
    title: "Site Plan Worksheet",
    purpose:
      "What the city requires shown on the site plan, with this job's dimensions filled in and the by-hand items listed.",
    goesWith: "Worksheet for the city's Site Plan sheet",
  },
  {
    slug: "compliance-report",
    title: "Compliance Report",
    purpose:
      "Every check the engine ran, what it confirmed and what it flagged, each with its citation and the date the source was verified.",
    goesWith: "Internal record — and the thing to hand a client",
  },
  {
    slug: "submission-checklist",
    title: "Submission Checklist",
    purpose:
      "Everything that goes in the envelope, what this job's scope pulls in, accepted file types, and the review timing.",
    goesWith: "Take it to the permit center",
  },
];

export function getDocument(slug: string): DocumentDefinition | undefined {
  return DOCUMENTS.find((d) => d.slug === slug);
}
