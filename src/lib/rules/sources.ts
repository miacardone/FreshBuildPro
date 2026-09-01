import type { Source } from "@/lib/engine/types";

const DECK_PLANS_URL =
  "https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/application-forms/all-forms-handouts-checklists-alphabetical-list/deck-plans/";

/**
 * Primary sources. Every rule points at one of these by id.
 *
 * The Cincinnati deck set is cited sheet by sheet rather than as one document,
 * because that is how a plan examiner reads it — a finding that says which
 * sheet it came from is one the contractor can actually go look at.
 *
 * A copy of the set as transcribed is kept at
 * docs/sources/cincinnati-residential-deck-drawings.pdf so a rule can be
 * checked against exactly what was read, not against whatever is at the URL
 * today.
 */

/** Stamped in the sheet footer of the set as downloaded. */
const DECK_SET_EDITION = "Sheet footer stamp SampleDeckPlot[3]11.15.06.dwg";
const DOWNLOADED = "2026-08-31";

export const SOURCES: Record<string, Source> = {
  "cin-deck-sheet1": {
    id: "cin-deck-sheet1",
    jurisdiction: "cincinnati-oh",
    title: 'City of Cincinnati — "Residential Deck Drawings"',
    locator: "Sheet 1 of 5 — General Notes and Framing/Footing Table",
    url: DECK_PLANS_URL,
    edition: DECK_SET_EDITION,
    lastVerified: DOWNLOADED,
    recheckEveryDays: 90,
  },
  "cin-deck-sheet2": {
    id: "cin-deck-sheet2",
    jurisdiction: "cincinnati-oh",
    title: 'City of Cincinnati — "Residential Deck Drawings"',
    locator: "Sheet 2 of 5 — Foundation & Framing Plan, Finished Floor Plan, Front Elevation",
    url: DECK_PLANS_URL,
    edition: DECK_SET_EDITION,
    lastVerified: DOWNLOADED,
    recheckEveryDays: 90,
  },
  "cin-deck-sheet3": {
    id: "cin-deck-sheet3",
    jurisdiction: "cincinnati-oh",
    title: 'City of Cincinnati — "Residential Deck Drawings"',
    locator: "Sheet 3 of 5 — Stair Section View and Handrail Sections",
    url: DECK_PLANS_URL,
    edition: DECK_SET_EDITION,
    lastVerified: DOWNLOADED,
    recheckEveryDays: 90,
  },
  "cin-deck-sheet4": {
    id: "cin-deck-sheet4",
    jurisdiction: "cincinnati-oh",
    title: 'City of Cincinnati — "Residential Deck Drawings"',
    locator: "Sheet 4 of 5 — Post & Beam Detail and Ledger Board Details",
    url: DECK_PLANS_URL,
    edition: DECK_SET_EDITION,
    lastVerified: DOWNLOADED,
    recheckEveryDays: 90,
  },
};

/* Permitting and property sources — the city's process pages rather than the
   drawing set. These govern whether the job can be submitted at all, and by
   which review path. */

Object.assign(SOURCES, {
  "cin-permit-review-process": {
    id: "cin-permit-review-process",
    jurisdiction: "cincinnati-oh",
    title: "City of Cincinnati Buildings & Inspections — Permit Review Process",
    locator: "Tier 1 / Tier 2 / Tier 3 review levels",
    url: "https://www.cincinnati-oh.gov/buildings/building-permit-forms-applications/permit-guide/permit-review-process/",
    edition: "Read 2026-08-31",
    lastVerified: "2026-08-31",
    recheckEveryDays: 60,
  },
  "cin-deck-permit-forms": {
    id: "cin-deck-permit-forms",
    jurisdiction: "cincinnati-oh",
    title: "City of Cincinnati Buildings & Inspections — Decks (application forms)",
    locator: "Required forms for a residential deck permit",
    url: "https://www.cincinnati-oh.gov/buildings/application-forms/deck/",
    edition: "Read 2026-08-31",
    lastVerified: "2026-08-31",
    recheckEveryDays: 60,
  },
  "cin-residential-permit-guide": {
    id: "cin-residential-permit-guide",
    jurisdiction: "cincinnati-oh",
    title: "City of Cincinnati Buildings & Inspections — Residential Permit Guide",
    locator: "Permit requirement, historic Certificate of Appropriateness, separate trade permits",
    url: "https://www.cincinnati-oh.gov/buildings/old-apply-for-a-building-permit/permit-guide/residential-permit-guide/",
    edition: "Read 2026-08-31",
    lastVerified: "2026-08-31",
    recheckEveryDays: 60,
  },
} satisfies Record<string, Source>);

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
