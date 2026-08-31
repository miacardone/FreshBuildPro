import type { Source } from "@/lib/engine/types";

/**
 * Primary sources. Every rule points at one of these by id.
 *
 * `lastVerified` is the date a human opened the document and confirmed the
 * encoded thresholds still match it. `recheckEveryDays` is the schedule.
 * Run `npm run rules:audit` to list anything past due.
 */
export const SOURCES: Record<string, Source> = {
  "cin-deck-drawings": {
    id: "cin-deck-drawings",
    jurisdiction: "cincinnati-oh",
    title: 'City of Cincinnati — "Residential Deck Drawings"',
    locator: "Sheet 1 of 5 — Framing / Footing Table, General Notes",
    url: "https://www.cincinnati-oh.gov/buildings/permits/residential-permits/",
    edition: "UNCONFIRMED — record the revision date printed on the sheet",
    lastVerified: "2026-08-31",
    recheckEveryDays: 90,
  },
  "cin-rcbo": {
    id: "cin-rcbo",
    jurisdiction: "cincinnati-oh",
    title: "Residential Code of Ohio (RCO), as adopted by the City of Cincinnati",
    locator: "UNCONFIRMED — record chapter and section per rule",
    url: "https://codes.ohio.gov/ohio-administrative-code/chapter-4101:8",
    edition: "UNCONFIRMED — record the adopted edition",
    lastVerified: "2026-08-31",
    recheckEveryDays: 180,
  },
};

export function getSource(id: string): Source {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source: ${id}. Every rule must cite a registered source.`);
  return s;
}

export function isPastDue(source: Source, now = new Date()): boolean {
  const last = new Date(source.lastVerified);
  const dueMs = last.getTime() + source.recheckEveryDays * 24 * 60 * 60 * 1000;
  return now.getTime() > dueMs;
}
