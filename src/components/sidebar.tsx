import Link from "next/link";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/rules", label: "Rules & Jurisdictions", icon: "shield" },
] as const;

function Icon({ name }: { name: (typeof NAV)[number]["icon"] }) {
  const common = { width: 15, height: 15, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.4 };
  if (name === "grid")
    return (
      <svg {...common} aria-hidden>
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      </svg>
    );
  if (name === "folder")
    return (
      <svg {...common} aria-hidden>
        <path d="M1.5 4.5a1 1 0 0 1 1-1h3l1.2 1.5h6.8a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1z" />
      </svg>
    );
  return (
    <svg {...common} aria-hidden>
      <path d="M8 1.5 13.5 3.5v4.2c0 3-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.8-5.5-6.8V3.5z" />
    </svg>
  );
}

/** The FB monogram in its bracket frame. */
function Mark() {
  return (
    <svg width="58" height="46" viewBox="0 0 58 46" aria-hidden className="text-gold">
      <g stroke="currentColor" strokeWidth="1.6" fill="none">
        <path d="M4 13V4h11M54 13V4H43M4 33v9h11M54 33v9H43" />
      </g>
      <text
        x="29"
        y="29"
        textAnchor="middle"
        className="serif"
        fill="currentColor"
        fontSize="17"
        fontWeight="700"
        letterSpacing="0.5"
      >
        FB
      </text>
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-rail-line bg-rail">
      <div className="flex flex-col items-center gap-2 px-5 pt-7 pb-6">
        <Mark />
        <div className="text-center">
          <div className="serif text-[15px] font-bold tracking-tight text-gold-bright">FreshBuild Pro</div>
          <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-rail-ink">
            Permit Operations
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-[13px] font-medium text-rail-ink transition hover:border-gold/30 hover:bg-white/5 hover:text-gold-bright"
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-rail-line px-5 py-5 text-center">
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-gold">
          Design. Comply. Build.
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.14em] text-rail-ink">Veteran Owned</div>
      </div>
    </aside>
  );
}
