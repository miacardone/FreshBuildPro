import type { Severity } from "@/lib/engine/types";

export const SEVERITY_META: Record<
  Severity,
  { label: string; chip: string; bar: string; blurb: string }
> = {
  blocker: {
    label: "Blocker",
    chip: "bg-blocker text-white",
    bar: "bg-blocker",
    blurb: "Fix before you submit — this gets the job rejected or held.",
  },
  warning: {
    label: "Warning",
    chip: "bg-warning text-white",
    bar: "bg-warning",
    blurb: "Expect the examiner to comment on this.",
  },
  confirm: {
    label: "Needs confirmation",
    chip: "bg-confirm text-white",
    bar: "bg-confirm",
    blurb: "The engine will not call this until the number is confirmed against the source.",
  },
  advisory: {
    label: "Advisory",
    chip: "bg-advisory text-white",
    bar: "bg-advisory",
    blurb: "Nothing wrong — worth knowing about this job.",
  },
};

export const SEVERITY_ORDER: Severity[] = ["blocker", "warning", "confirm", "advisory"];

export function SeverityChip({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity];
  return (
    <span className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-semibold ${m.chip}`}>
      {m.label}
    </span>
  );
}
