import { describe, expect, it } from "vitest";
import { applyOption, solveFraming, solveTier1, totalJoistRunFt } from "@/lib/engine/solver";
import { evaluate } from "@/lib/engine/evaluate";
import { SEED_PROJECTS } from "@/lib/store/seed";
import { CINCINNATI_JOIST_SPANS, findBeamOption } from "@/lib/rules/cincinnati/deck-tables";
import type { DeckProject } from "@/lib/engine/types";

const willis = SEED_PROJECTS.find((p) => p.id === "seed-willis-deck")!;
const ludlow = SEED_PROJECTS.find((p) => p.id === "seed-ludlow-deck")!;

/** The rules the solver is responsible for clearing. Guards, stairs and the
 *  property rules are outside its remit and may still trip. */
const FRAMING_RULES = new Set([
  "cin-deck-joist-spacing",
  "cin-deck-joist-span",
  "cin-deck-beam-row",
  "cin-deck-beam-span",
  "cin-deck-footing-size",
  "cin-deck-footing-depth",
  "cin-deck-post-size",
  "cin-deck-ledger-bolt-spacing",
]);

function framingBlockers(project: DeckProject) {
  return evaluate(project)
    .findings.filter((f) => f.severity === "blocker" && FRAMING_RULES.has(f.ruleId))
    .map((f) => `${f.ruleId}: ${f.title}`);
}

describe("every option the solver offers actually passes", () => {
  const cases: [string, DeckProject][] = [
    ["the Ludlow napkin job", ludlow],
    ["a 24 ft run", { ...ludlow, joistSpanFt: 24 }],
    ['24" spacing', { ...ludlow, joistSpacingIn: 24 }],
    ["shallow footings", { ...ludlow, footingDepthIn: 12, footingDiameterIn: 8 }],
    ["an off-table beam", { ...willis, joistSize: "2x12", beamSize: "(2) 2x6", joistSpanFt: 16 }],
    ["a tall deck on 4x4 posts", { ...ludlow, deckHeightIn: 140, postSize: "4x4" }],
    ["a freestanding deck", { ...ludlow, attachment: "freestanding", ledgerBoltSpacingIn: undefined }],
  ];

  for (const [label, project] of cases) {
    it(`clears every framing blocker on ${label}`, () => {
      const options = solveFraming(project);
      expect(options.length, "solver returned nothing").toBeGreaterThan(0);
      for (const option of options) {
        const fixed = applyOption(project, option);
        expect(framingBlockers(fixed), `${label} → ${option.joistSize} / ${option.beamSize}`).toEqual([]);
      }
    });
  }
});

describe("the options are drawn from the city's table, never invented", () => {
  it("only proposes joist spans the table allows", () => {
    for (const option of solveFraming({ ...ludlow, joistSpanFt: 30 })) {
      expect(option.joistSpanFt).toBeLessThanOrEqual(CINCINNATI_JOIST_SPANS[option.joistSize]);
    }
  });

  it("only proposes beam rows that exist for the joist chosen", () => {
    for (const option of solveFraming(ludlow)) {
      const row = findBeamOption(option.joistSize, option.beamSize);
      expect(row, `${option.joistSize} / ${option.beamSize} is not on the sheet`).toBeDefined();
      expect(option.postSpacingMaxFt).toBe(row!.maxSpanFt);
      expect(option.footing).toEqual(
        option.spanConfiguration === "single_span" ? row!.footingSingleSpan : row!.footingMultiSpan,
      );
    }
  });

  it("always pins spacing at the 16 in o.c. the table is built on", () => {
    for (const option of solveFraming({ ...ludlow, joistSpacingIn: 24 })) {
      expect(option.joistSpacingIn).toBe(16);
    }
  });
});

describe("ranking", () => {
  it("is deterministic", () => {
    expect(solveFraming(ludlow)).toEqual(solveFraming(ludlow));
  });

  it("puts the fewest-changes option first", () => {
    const options = solveFraming(ludlow);
    const counts = options.map((o) => o.changes.length);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });

  it("tells a compliant deck it is already there, with nothing to change", () => {
    const options = solveFraming(willis);
    expect(options[0].isCurrent).toBe(true);
    expect(options[0].changes).toEqual([]);
  });

  it("offers a multi-span route that halves the span on a long run", () => {
    // Ludlow's 20 ft run is over every single-span row; multi-span makes it 10 ft.
    const options = solveFraming(ludlow);
    const multi = options.filter((o) => o.spanConfiguration === "multi_span");
    expect(multi.length).toBeGreaterThan(0);
    expect(multi.every((o) => o.joistSpanFt === 10)).toBe(true);
  });

  it("still finds the single-span answer when the table has one", () => {
    // A 13 ft run is inside the 2x10 row at 13 ft.
    const options = solveFraming({ ...ludlow, joistSpanFt: 13 });
    const single = options.filter((o) => o.spanConfiguration === "single_span");
    expect(single.some((o) => o.joistSize === "2x10")).toBe(true);
  });
});

describe("the joist run", () => {
  it("doubles a multi-span project's stated clear span to get the total run", () => {
    expect(totalJoistRunFt({ ...willis, joistSpanFt: 10, spanConfiguration: "multi_span" })).toBe(20);
    expect(totalJoistRunFt({ ...willis, joistSpanFt: 10, spanConfiguration: "single_span" })).toBe(10);
  });

  it("returns nothing when there is no span to solve", () => {
    expect(solveFraming({ ...willis, joistSpanFt: undefined })).toEqual([]);
  });
});

describe("Tier 1 arithmetic", () => {
  it("confirms a deck already under the threshold", () => {
    const t = solveTier1(willis)!; // 16 x 12 = 192
    expect(t.qualifies).toBe(true);
    expect(t.areaSqFt).toBe(192);
  });

  it("shows what to trim on a deck at the threshold", () => {
    const t = solveTier1(ludlow)!; // 20 x 20 = 400
    expect(t.qualifies).toBe(false);
    expect(t.reduceBySqFt).toBe(1);
    expect(t.suggestions.length).toBeGreaterThan(0);
    for (const s of t.suggestions) {
      expect(s.areaSqFt).toBeLessThan(400);
    }
  });
});
