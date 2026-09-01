import { loadProject } from "@/lib/project-view";
import { JobForm } from "@/components/job-form";
import { updateJob } from "@/app/projects/actions";

export const dynamic = "force-dynamic";

export default async function IntakePage({ params }: PageProps<"/projects/[id]/intake">) {
  const { id } = await params;
  const { project } = await loadProject(id);

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-muted">
        Change a number and the engine re-runs on save. Every run is kept in Revisions.
      </p>
      <JobForm action={updateJob.bind(null, id)} project={project} submitLabel="Save and re-check" />
    </div>
  );
}
