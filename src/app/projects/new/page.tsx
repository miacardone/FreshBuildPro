import Link from "next/link";
import { JobForm } from "@/components/job-form";
import { createJob } from "@/app/projects/actions";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/projects" className="text-[12px] text-ink-muted hover:text-ink">
        ← All projects
      </Link>
      <h1 className="serif mt-2 text-2xl font-bold tracking-tight">New project</h1>
      <p className="mt-1 mb-6 text-[13px] text-ink-muted">
        Enter the job the way you already have it in your head. The engine checks it against
        Cincinnati&apos;s own rules before anything goes to the city.
      </p>
      <JobForm action={createJob} submitLabel="Run the check" />
    </div>
  );
}
