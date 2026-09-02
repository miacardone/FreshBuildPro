import Link from "next/link";
import { notFound } from "next/navigation";
import { loadProject } from "@/lib/project-view";
import { getDocument } from "@/lib/documents/registry";
import { PrintButton } from "@/components/documents/print-button";
import {
  ComplianceReportSheet,
  CoverSheet,
  DeckPlanSheet,
  FramingScheduleSheet,
  SitePlanSheet,
  SubmissionChecklistSheet,
  type DocProps,
} from "@/components/documents/sheets";

export const dynamic = "force-dynamic";

const SHEETS: Record<string, (p: DocProps) => React.ReactElement> = {
  cover: CoverSheet,
  "deck-plan": DeckPlanSheet,
  "framing-schedule": FramingScheduleSheet,
  "site-plan": SitePlanSheet,
  "compliance-report": ComplianceReportSheet,
  "submission-checklist": SubmissionChecklistSheet,
};

export default async function DocumentPage({ params }: PageProps<"/projects/[id]/documents/[doc]">) {
  const { id, doc } = await params;
  const definition = getDocument(doc);
  const Component = SHEETS[doc];
  if (!definition || !Component) notFound();

  const { project, evaluation } = await loadProject(id);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/projects/${id}/documents`} className="text-[12px] text-gold hover:underline">
          ← All documents
        </Link>
        <PrintButton />
      </div>
      <Component project={project} evaluation={evaluation} />
    </div>
  );
}
