"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded bg-gold px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 print:hidden"
    >
      Print / Save as PDF
    </button>
  );
}
