const TONE = {
  neutral: { bg: "bg-tile-neutral", value: "text-white" },
  blocked: { bg: "bg-tile-blocked", value: "text-[#ff6b6b]" },
  ready: { bg: "bg-tile-ready", value: "text-[#4ade80]" },
  engineering: { bg: "bg-tile-eng", value: "text-gold-bright" },
} as const;

const ICONS = {
  folder: "M1.5 4.5a1 1 0 0 1 1-1h3l1.2 1.5h6.8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z",
  alert: "M8 1.5 15 14H1zM8 6v4M8 11.5v.5",
  check: "M8 1.5A6.5 6.5 0 1 0 8 14.5 6.5 6.5 0 0 0 8 1.5zM5 8l2 2 4-4",
  bolt: "M9 1 3.5 9H8l-1 6 5.5-8H8z",
  stamp: "M4 14h8M5.5 11h5V8.5a2.5 2.5 0 0 0-1-2C9 5.5 9 4 9 3a1 1 0 0 0-2 0c0 1 0 1.5-.5 3.5a2.5 2.5 0 0 0-1 2z",
} as const;

export function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: keyof typeof TONE;
  icon: keyof typeof ICONS;
}) {
  const t = TONE[tone];
  return (
    <div className={`relative overflow-hidden rounded-lg px-4 py-3.5 ${t.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium text-white/70">{label}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          className={`shrink-0 ${t.value} opacity-80`}
          aria-hidden
        >
          <path d={ICONS[icon]} />
        </svg>
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums leading-none ${t.value}`}>{value}</div>
    </div>
  );
}
