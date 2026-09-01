"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { segment: "", label: "Overview" },
  { segment: "intake", label: "Intake" },
  { segment: "issues", label: "Issues" },
  { segment: "documents", label: "Documents" },
  { segment: "checklist", label: "Checklist" },
  { segment: "revisions", label: "Revisions" },
];

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav className="flex flex-wrap gap-0 border-b border-line">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:border-line hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
