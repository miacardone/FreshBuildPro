import { describe, expect, it } from "vitest";
import { evaluate, score, missingRequiredFields } from "@/lib/engine/evaluate";
import { getRuleSet, UnsupportedJurisdictionError } from "@/lib/engine/jurisdictions";
import { SEED_PROJECTS } from "@/lib/store/seed";
import { cincinnatiDeckRules } from "@/lib/rules/cincinnati/deck";
import { SOURCES } from "@/lib/rules/sources";
import type { DeckProject } from "@/lib/engine/types";

const willis = SEED_PROJECTS.find((p) => p.id === "seed-willis-deck")!;
const ludlow = SEED_PROJECTS.find((p) => p.id === "seed-ludlow-deck")!;

describe("determinism", () => {
  it("gives the same findings for the same job every time", () => {
    const a = evaluate(willis, new Date("2026-08-31T00:00:00Z"));
    const b = evaluate(willis, new Date("2026-08-31T00:00:00Z"));
    expect(b).toEqual(a);
  });

  it("records every rule it considered, applied or not", () => {
    const e = evaluate(willis);
    const ruleSet = getRuleSet(willis.jurisdiction, willis.trade);
    expect(e.runs).toHaveLength(ruleSet.rules.length);
  });
});

describe("joist span against the city's table", () => {
  it("blocks a 20 ft span on 2x8 at 16 in o.c. — the confirmed 10 ft cell", () => {
    const e = evaluate(ludlow);
    const f = e.findings.find((x) => x.ruleId === "cin-deck-joist-span");
    expect(f?.severity).toBe("blocker");
    expect(f?.title).toContain("20 ft");
    expect(f?.title).toContain("10 ft");
    expect(f?.required).toBe("10 ft maximum");
  });

  it("passes a 10 ft span on the same joist and spacing", () => {
    const e = evaluate(willis);
    expect(e.findings.some((f) => f.ruleId === "cin-deck-joist-span")).toBe(false);
  });

  it("will not assert on a span cell that has not been confirmed", () => {
    const job: DeckProject = { ...willis, joistSize: "2x10", joistSpanFt: 40 };
    const e = evaluate(job);
    const f = e.findings.find((x) => x.ruleId === "cin-deck-joist-span");
    // 40 ft is plainly too far, but the cell is unconfirmed, so the engine
    // must ask rather than fail it on a number it has not read off the sheet.
    expect(f?.severity).toBe("confirm");
  });
});

describe("unconfirmed rules never assert", () => {
  it("downgrades any non-info finding from a needs_confirmation rule", () => {
    const e = evaluate(ludlow);
    const unconfirmedIds = new Set(
      cincinnatiDeckRules.filter((r) => r.confidence === "needs_confirmation").map((r) => r.id),
    );
    const asserted = e.findings.filter(
      (f) => unconfirmedIds.has(f.ruleId) && f.severity !== "confirm" && f.severity !== "info",
    );
    expect(asserted).toEqual([]);
  });
});

describe("jurisdiction boundary", () => {
  it("refuses a city it has not learned instead of approximating", () => {
    const job: DeckProject = { ...willis, jurisdiction: "columbus-oh" };
    expect(() => evaluate(job)).toThrow(UnsupportedJurisdictionError);
  });

  it("refuses a trade it has not learned in a covered city", () => {
    const job = { ...willis, trade: "kitchen" } as unknown as DeckProject;
    expect(() => evaluate(job)).toThrow(UnsupportedJurisdictionError);
  });
});

describe("readiness", () => {
  it("is never ready while a blocker stands", () => {
    const r = score(
      [{ ruleId: "x", severity: "blocker", title: "t", why: "w", fix: "f", sourceId: "cin-deck-drawings" }],
      [],
    );
    expect(r.status).toBe("not_ready");
  });

  it("is never ready while a required field is missing", () => {
    const r = score([], ["Footing depth"]);
    expect(r.status).toBe("not_ready");
    expect(r.score).toBeLessThan(100);
  });

  it("is ready on a clean job with nothing missing", () => {
    const r = score([{ ruleId: "x", severity: "info", title: "t", why: "w", fix: "f", sourceId: "cin-deck-drawings" }], []);
    expect(r.status).toBe("ready");
    expect(r.score).toBe(100);
  });

  it("flags the fields a permit package cannot be assembled without", () => {
    expect(missingRequiredFields(willis)).toEqual([]);
    expect(missingRequiredFields({ ...willis, footingDepthIn: undefined })).toContain("Footing depth");
  });
});

describe("rule set integrity", () => {
  it("gives every rule a registered source", () => {
    for (const rule of cincinnatiDeckRules) {
      expect(SOURCES[rule.sourceId], `${rule.id} cites unknown source ${rule.sourceId}`).toBeDefined();
    }
  });

  it("keeps rule ids unique", () => {
    const ids = cincinnatiDeckRules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never asks for lumber species — Cincinnati settles it in General Note 2", () => {
    const fields = Object.keys(willis).join(" ").toLowerCase();
    expect(fields).not.toContain("species");
  });
});
