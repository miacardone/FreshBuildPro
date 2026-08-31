/**
 * Lists every source past its re-check date, and the confirmation state of the
 * rule set. Run with `npm run rules:audit`.
 */
import { SOURCES, isPastDue } from "@/lib/rules/sources";
import { allRuleSets } from "@/lib/engine/jurisdictions";
import { CINCINNATI_BEAM_OPTIONS, CINCINNATI_JOIST_SPANS } from "@/lib/rules/cincinnati/deck-tables";

const now = new Date();
let problems = 0;

console.log("\nSources\n" + "-".repeat(60));
for (const s of Object.values(SOURCES)) {
  const due = isPastDue(s, now);
  if (due) problems++;
  console.log(`${due ? "PAST DUE" : "ok      "}  ${s.id}  (verified ${s.lastVerified}, every ${s.recheckEveryDays}d)`);
  if (s.edition?.startsWith("UNCONFIRMED")) {
    problems++;
    console.log(`          ^ edition not recorded`);
  }
}

console.log("\nRules\n" + "-".repeat(60));
for (const set of allRuleSets()) {
  const verified = set.rules.filter((r) => r.confidence === "verified").length;
  console.log(`${set.jurisdiction} / ${set.trade}  v${set.version}`);
  console.log(`  ${verified} verified, ${set.rules.length - verified} awaiting confirmation, ${set.rules.length} total`);
  for (const r of set.rules.filter((x) => x.confidence === "needs_confirmation")) {
    console.log(`    - ${r.id}`);
  }
}

console.log(
  `\nCincinnati framing table: ${Object.keys(CINCINNATI_JOIST_SPANS).length} joist rows, ` +
    `${CINCINNATI_BEAM_OPTIONS.length} beam rows transcribed from Sheet 1`,
);
console.log(`\n${problems === 0 ? "Nothing past due." : `${problems} item(s) need attention.`}\n`);
