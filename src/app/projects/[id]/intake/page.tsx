import { loadProject } from "@/lib/project-view";
import { JobForm } from "@/components/job-form";
import { deleteJob, updateJob } from "@/app/projects/actions";

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

      <section className="card mt-5 border-blocker/30 p-5">
        <div className="eyebrow text-blocker">Danger zone</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-muted">
            Deleting <strong className="text-ink">{project.name}</strong> removes the job and its
            revision history. This cannot be undone.
          </p>
          <form action={deleteJob.bind(null, id)}>
            <button
              type="submit"
              className="rounded border border-blocker px-3 py-1.5 text-[12.5px] font-semibold text-blocker transition hover:bg-blocker hover:text-white"
            >
              Delete this project
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
