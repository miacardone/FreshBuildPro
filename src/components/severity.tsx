import type { Severity } from "@/lib/engine/types";

export const SEVERITY_META: Record<
  Severity,
  { label: string; chip: string; bar: string; blurb: string }
> = {
  blocker: {
    label: "Will be rejected",
    chip: "bg-blocker-soft text-blocker border-blocker/20",
    bar: "bg-blocker",
    blurb: "Fix before you submit.",
  },
  correction: {
    label: "Likely correction",
    chip: "bg-correction-soft text-correction border-correction/20",
    bar: "bg-correction",
    blurb: "Expect the examiner to comment on this.",
  },
  confirm: {
    label: "Needs confirmation",
    chip: "bg-confirm-soft text-confirm border-confirm/20",
    bar: "bg-confirm",
    blurb: "The engine will not call this until the number is confirmed against the source.",
  },
  info: {
    label: "Good to know",
    chip: "bg-info-soft text-info border-info/20",
    bar: "bg-info",
    blurb: "Nothing wrong — jurisdiction context.",
  },
};

export const SEVERITY_ORDER: Severity[] = ["blocker", "correction", "confirm", "info"];

export function SeverityChip({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.chip}`}
    >
      {m.label}
    </span>
  );
}
