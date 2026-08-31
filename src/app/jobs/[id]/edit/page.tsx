import { notFound } from "next/navigation";
import Link from "next/link";
import { store } from "@/lib/store";
import { JobForm } from "@/components/job-form";
import { updateJob } from "@/app/jobs/actions";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: PageProps<"/jobs/[id]/edit">) {
  const { id } = await params;
  const project = await store.get(id);
  if (!project) notFound();

  const action = updateJob.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/jobs/${id}`} className="text-sm text-muted hover:text-foreground">
        ← Back to {project.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit job</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Change a number and the engine re-runs on save. Every run is kept in the job&apos;s history.
      </p>
      <JobForm action={action} project={project} submitLabel="Save and re-check" />
    </div>
  );
}
