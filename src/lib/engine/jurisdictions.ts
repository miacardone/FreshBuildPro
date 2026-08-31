import type { DeckProject, Rule } from "@/lib/engine/types";
import {
  cincinnatiDeckRules,
  CINCINNATI_DECK_RULESET_VERSION,
} from "@/lib/rules/cincinnati/deck";

export interface RuleSet {
  jurisdiction: string;
  trade: string;
  version: string;
  rules: Rule<DeckProject>[];
}

export interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  /** Trades covered here. The engine refuses anything not listed. */
  trades: string[];
}

export const JURISDICTIONS: Jurisdiction[] = [
  { id: "cincinnati-oh", name: "Cincinnati", state: "OH", trades: ["deck"] },
];

const RULE_SETS: RuleSet[] = [
  {
    jurisdiction: "cincinnati-oh",
    trade: "deck",
    version: CINCINNATI_DECK_RULESET_VERSION,
    rules: cincinnatiDeckRules,
  },
];

export class UnsupportedJurisdictionError extends Error {
  constructor(
    readonly jurisdiction: string,
    readonly trade: string,
  ) {
    super(
      `FreshBuild Pro has not learned ${trade} rules for "${jurisdiction}" yet. ` +
        `It will not guess at a city it has not encoded.`,
    );
    this.name = "UnsupportedJurisdictionError";
  }
}

/** Returns the rule set, or throws. The engine never falls back to a "close enough" city. */
export function getRuleSet(jurisdiction: string, trade: string): RuleSet {
  const set = RULE_SETS.find((r) => r.jurisdiction === jurisdiction && r.trade === trade);
  if (!set) throw new UnsupportedJurisdictionError(jurisdiction, trade);
  return set;
}

export function hasRuleSet(jurisdiction: string, trade: string): boolean {
  return RULE_SETS.some((r) => r.jurisdiction === jurisdiction && r.trade === trade);
}

export function allRuleSets(): RuleSet[] {
  return RULE_SETS;
}

export function jurisdictionName(id: string): string {
  const j = JURISDICTIONS.find((x) => x.id === id);
  return j ? `${j.name}, ${j.state}` : id;
}
