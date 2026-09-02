import { describe, expect, it } from "vitest";
import { evaluate, score, missingRequiredFields } from "@/lib/engine/evaluate";
import { getRuleSet, UnsupportedJurisdictionError } from "@/lib/engine/jurisdictions";
import { SEED_PROJECTS } from "@/lib/store/seed";
import { cincinnatiDeckRules } from "@/lib/rules/cincinnati/deck";
import { SOURCES } from "@/lib/rules/sources";
import { CINCINNATI_BEAM_OPTIONS, CINCINNATI_JOIST_SPANS } from "@/lib/rules/cincinnati/deck-tables";
import { cincinnatiPermitRules, TIER_1_MAX_AREA_SQFT } from "@/lib/rules/cincinnati/permit";
import type { DeckProject, Severity } from "@/lib/engine/types";

const willis = SEED_PROJECTS.find((p) => p.id === "seed-willis-deck")!;
const ludlow = SEED_PROJECTS.find((p) => p.id === "seed-ludlow-deck")!;

const findingFor = (p: DeckProject, ruleId: string) =>
  evaluate(p).findings.find((f) => f.ruleId === ruleId);

const severityFor = (p: DeckProject, ruleId: string): Severity | undefined =>
  findingFor(p, ruleId)?.severity;

describe("determinism", () => {
  it("gives the same findings for the same job every time", () => {
    const at = new Date("2026-08-31T00:00:00Z");
    expect(evaluate(willis, at)).toEqual(evaluate(willis, at));
  });

  it("records every rule it considered, applied or not", () => {
    const ruleSet = getRuleSet(willis.jurisdiction, willis.trade);
    expect(evaluate(willis).runs).toHaveLength(ruleSet.rules.length);
  });
});

describe("the Willis deck — built to code, should come back clean", () => {
  it("raises no blockers and no corrections", () => {
    const e = evaluate(willis);
    const actionable = e.findings.filter((f) => f.severity !== "advisory");
    expect(actionable, JSON.stringify(actionable.map((f) => f.title), null, 2)).toEqual([]);
  });

  it("is ready to submit with nothing missing", () => {
    const e = evaluate(willis);
    expect(e.readiness.status).toBe("ready");
    expect(e.readiness.missingFields).toEqual([]);
  });
});

describe("joist span against the city's table", () => {
  it("blocks the 20 ft span on 2x8 that the table caps at 10 ft", () => {
    const f = findingFor(ludlow, "cin-deck-joist-span")!;
    expect(f.severity).toBe("blocker");
    expect(f.title).toContain("20 ft");
    expect(f.title).toContain("10 ft");
    expect(f.required).toBe("10 ft maximum");
  });

  it("passes each joist size at exactly its table span", () => {
    for (const [size, max] of Object.entries(CINCINNATI_JOIST_SPANS)) {
      const job = { ...willis, joistSize: size as DeckProject["joistSize"], joistSpanFt: max };
      expect(severityFor(job, "cin-deck-joist-span"), `${size} at ${max} ft`).toBeUndefined();
    }
  });

  it("blocks each joist size one foot over its table span", () => {
    for (const [size, max] of Object.entries(CINCINNATI_JOIST_SPANS)) {
      const job = { ...willis, joistSize: size as DeckProject["joistSize"], joistSpanFt: max + 1 };
      expect(severityFor(job, "cin-deck-joist-span"), `${size} at ${max + 1} ft`).toBe("blocker");
    }
  });
});

describe("the questions Cincinnati does not ask", () => {
  it('blocks 24" o.c. spacing, which the table does not cover', () => {
    const job = { ...willis, joistSpacingIn: 24 as const };
    expect(severityFor(job, "cin-deck-joist-spacing")).toBe("blocker");
  });

  it("never asks for lumber species — General Note 2 settles it", () => {
    expect(Object.keys(willis).join(" ").toLowerCase()).not.toContain("species");
    const f = findingFor(willis, "cin-deck-species-settled")!;
    expect(f.severity).toBe("advisory");
    expect(f.required).toContain("Southern Pine");
  });
});

describe("rules a generic IRC-based tool would get wrong here", () => {
  it('allows 4x4 posts at 7 ft, which the city permits up to 8 ft', () => {
    const job = { ...willis, postSize: "4x4" as const, deckHeightIn: 84 };
    expect(severityFor(job, "cin-deck-post-size")).toBeUndefined();
  });

  it("blocks 4x4 posts over 8 ft, where the city stops allowing them", () => {
    const job = { ...willis, postSize: "4x4" as const, deckHeightIn: 108 };
    expect(severityFor(job, "cin-deck-post-size")).toBe("blocker");
  });

  it('allows an 8" riser, under Cincinnati\'s 8 1/4" max rather than the IRC 7 3/4"', () => {
    const job = { ...willis, riserHeightIn: 8 };
    expect(severityFor(job, "cin-deck-stair-riser")).toBeUndefined();
  });

  it('allows a 9" tread, under Cincinnati\'s 9" min rather than the IRC 10"', () => {
    const job = { ...willis, treadDepthIn: 9 };
    expect(severityFor(job, "cin-deck-stair-tread")).toBeUndefined();
  });

  it("treats a brick-veneer ledger as a detail to show, not a redesign", () => {
    const job = { ...willis, wallCladding: "brick_veneer" as const };
    const f = findingFor(job, "cin-deck-ledger-detail")!;
    expect(f.severity).toBe("advisory");
    expect(f.title).toContain("Brick Veneer");
    expect(f.fix).toContain("weep holes");
  });
});

describe("the Ludlow deck — the napkin job", () => {
  const e = evaluate(ludlow);
  const ids = e.findings.filter((f) => f.severity === "blocker").map((f) => f.ruleId);

  it("catches the span, the beam, the footing depth and the guards", () => {
    expect(ids).toContain("cin-deck-joist-span");
    expect(ids).toContain("cin-deck-beam-span");
    expect(ids).toContain("cin-deck-footing-depth");
    expect(ids).toContain("cin-deck-guard-required");
    expect(ids).toContain("cin-deck-guard-opening");
    expect(ids).toContain("cin-deck-guard-post-spacing");
    expect(ids).toContain("cin-deck-diagonal-brace");
    expect(ids).toContain("cin-deck-stair-handrail");
  });

  it("catches the hot tub the stock drawings do not cover", () => {
    expect(ids).toContain("cin-deck-hot-tub");
  });

  it("does not flag its 4x4 posts, which are legal at that height", () => {
    expect(ids).not.toContain("cin-deck-post-size");
  });

  it("is not ready — the hot tub alone puts it outside the stock drawings", () => {
    expect(e.readiness.status).toBe("engineering_review");
  });
});

describe("beam rows travel together", () => {
  it("rejects a beam that is not offered for the joist size", () => {
    const job = { ...willis, joistSize: "2x12" as const, beamSize: "(2) 2x6" as const };
    expect(severityFor(job, "cin-deck-beam-row")).toBe("blocker");
  });

  it("sizes footings off the row and the span configuration", () => {
    // (2) 2x12 under 2x12 joists: 16"/8" single-span, 28"/14" multi-span.
    const single = { ...willis, joistSize: "2x12" as const, beamSize: "(2) 2x12" as const, joistSpanFt: 16, beamSpanFt: 8, spanConfiguration: "single_span" as const, footingDiameterIn: 16, footingThicknessIn: 8 };
    expect(severityFor(single, "cin-deck-footing-size")).toBeUndefined();

    const multi = { ...single, spanConfiguration: "multi_span" as const };
    expect(severityFor(multi, "cin-deck-footing-size")).toBe("blocker");
  });

  it("reads ledger bolt spacing off the same row", () => {
    const job = { ...willis, ledgerBoltSpacingIn: 24 }; // row calls for 16"
    const f = findingFor(job, "cin-deck-ledger-bolt-spacing")!;
    expect(f.severity).toBe("blocker");
    expect(f.required).toContain('16"');
  });
});

describe("the engine will not assert what the source leaves ambiguous", () => {
  it('reports footing dimension [D] rather than failing on it, because Sheet 1 and Sheet 4 disagree', () => {
    const job = { ...willis, footingThicknessIn: 1 };
    const f = findingFor(job, "cin-deck-footing-size")!;
    expect(f.severity).toBe("confirm");
    expect(f.why).toContain("Sheet 4");
  });

  it("downgrades any non-info finding from an unconfirmed rule", () => {
    const unconfirmed = new Set(
      cincinnatiDeckRules.filter((r) => r.confidence === "needs_confirmation").map((r) => r.id),
    );
    for (const project of [willis, ludlow]) {
      const asserted = evaluate(project).findings.filter(
        (f) => unconfirmed.has(f.ruleId) && f.severity !== "confirm" && f.severity !== "advisory",
      );
      expect(asserted).toEqual([]);
    }
  });
});

describe("jurisdiction boundary", () => {
  it("refuses a city it has not learned instead of approximating", () => {
    expect(() => evaluate({ ...willis, jurisdiction: "columbus-oh" })).toThrow(UnsupportedJurisdictionError);
  });

  it("refuses a trade it has not learned in a covered city", () => {
    expect(() => evaluate({ ...willis, trade: "kitchen" } as unknown as DeckProject)).toThrow(
      UnsupportedJurisdictionError,
    );
  });
});

describe("review tier and the permit path", () => {
  it("puts a deck under 400 sq ft on Tier 1 same-day review", () => {
    // Willis is 16 x 12 = 192 sq ft.
    expect(evaluate(willis).reviewTier).toBe("tier_1");
    const f = findingFor(willis, "cin-tier1-eligibility")!;
    expect(f.severity).toBe("advisory");
    expect(f.title).toContain("Tier 1");
  });

  it("treats exactly 400 sq ft as over the limit, because the city says under", () => {
    const job = { ...willis, deckLength: 20, deckWidth: 20 };
    expect(evaluate(job).reviewTier).toBe("tier_2_or_3");
    expect(severityFor(job, "cin-tier1-eligibility")).toBe("warning");
  });

  it("blocks a historic property until the Certificate of Appropriateness is in hand", () => {
    const job = { ...willis, inHistoricDistrict: true };
    const f = findingFor(job, "cin-historic-coa")!;
    expect(f.severity).toBe("blocker");
    expect(evaluate(job).readiness.status).toBe("blocked");
  });

  it("does not guess whether the floodplain pulls a Tier 1 deck out of same-day review", () => {
    const job = { ...willis, inFloodplain: true };
    expect(severityFor(job, "cin-floodplain-tier")).toBe("confirm");
  });

  it("raises the separate trade permits the scope pulls in", () => {
    const job = { ...willis, hasElectrical: true, hasPlumbing: true, hasMechanical: true };
    expect(severityFor(job, "cin-electrical-permit")).toBe("confirm");
    expect(severityFor(job, "cin-plumbing-permit")).toBe("confirm");
    expect(severityFor(job, "cin-mechanical-permit")).toBe("confirm");
  });

  it("says plainly that zoning is not checked here", () => {
    const f = findingFor(willis, "cin-zoning-not-evaluated")!;
    expect(f.severity).toBe("advisory");
    expect(f.title.toLowerCase()).toContain("setback");
  });

  it("keeps the Tier 1 threshold at the city's 400 sq ft", () => {
    expect(TIER_1_MAX_AREA_SQFT).toBe(400);
  });
});

describe("engineering review", () => {
  it("escalates a job the stock drawing set does not cover", () => {
    const job = { ...willis, hasHotTub: true };
    expect(evaluate(job).readiness.status).toBe("engineering_review");
  });

  it("escalates an off-table beam and joist combination", () => {
    const job = { ...willis, joistSize: "2x12" as const, beamSize: "(2) 2x6" as const };
    expect(evaluate(job).readiness.status).toBe("engineering_review");
  });
});

describe("readiness", () => {
  it("is never ready while a blocker stands", () => {
    const r = score(
      [{ ruleId: "x", severity: "blocker", title: "t", why: "w", fix: "f", sourceId: "cin-deck-sheet1" }],
      [],
    );
    expect(r.status).toBe("blocked");
  });

  it("is never ready while a required field is missing", () => {
    const r = score([], ["Footing depth"]);
    expect(r.status).toBe("blocked");
  });

  it("flags the fields a permit package cannot be assembled without", () => {
    expect(missingRequiredFields(willis)).toEqual([]);
    expect(missingRequiredFields({ ...willis, footingDepthIn: undefined })).toContain("Footing depth");
  });
});

describe("rule set integrity", () => {
  const allRules = [...cincinnatiPermitRules, ...cincinnatiDeckRules];

  it("gives every rule a registered source", () => {
    for (const rule of allRules) {
      expect(SOURCES[rule.sourceId], `${rule.id} cites unknown source`).toBeDefined();
    }
  });

  it("keeps rule ids and examiner-facing codes unique", () => {
    const ids = allRules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    const codes = allRules.map((r) => r.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("transcribes all ten beam rows from the sheet", () => {
    expect(CINCINNATI_BEAM_OPTIONS).toHaveLength(10);
  });
});

describe("confirming the calls a contractor already made", () => {
  it("confirms the Willis deck's 6x6 posts at that height — the brief's own example", () => {
    const c = evaluate(willis).confirmed.find((x) => x.ruleId === "cin-deck-post-size")!;
    expect(c).toBeDefined();
    expect(c.title).toContain("6x6");
    expect(c.observed).toContain('72"');
    expect(c.required).toContain("4x4");
  });

  it("confirms the bracing the code wants — the brief's other example", () => {
    const c = evaluate(willis).confirmed.find((x) => x.ruleId === "cin-deck-diagonal-brace")!;
    expect(c).toBeDefined();
    expect(c.required).toContain("all decks");
  });

  it("confirms a good deck broadly, with a citation on each", () => {
    const e = evaluate(willis);
    expect(e.confirmed.length).toBeGreaterThanOrEqual(10);
    for (const c of e.confirmed) {
      expect(SOURCES[c.sourceId], `${c.ruleId} confirmed without a source`).toBeDefined();
    }
  });

  it("never confirms a check the same rule flagged", () => {
    for (const project of [willis, ludlow]) {
      const e = evaluate(project);
      const flagged = new Set(
        e.findings.filter((f) => f.severity !== "advisory").map((f) => f.ruleId),
      );
      const contradictions = e.confirmed.filter((c) => flagged.has(c.ruleId));
      expect(contradictions).toEqual([]);
    }
  });

  it("does not confirm the framing on the napkin job", () => {
    const ids = evaluate(ludlow).confirmed.map((c) => c.ruleId);
    expect(ids).not.toContain("cin-deck-joist-span");
    expect(ids).not.toContain("cin-deck-guard-required");
  });
});
