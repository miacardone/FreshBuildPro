import type { DeckProject } from "@/lib/engine/types";
import { JURISDICTIONS } from "@/lib/engine/jurisdictions";

/**
 * Intake. Plain fields — the way a contractor already has the job in his head.
 * No CAD, no drafting, and deliberately no lumber-species field: Cincinnati's
 * General Note 2 already settles species, so asking would be asking a question
 * this city does not ask.
 */

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <h2 className="eyebrow text-ink">{title}</h2>
      {hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  children,
  suffix,
}: {
  label: string;
  name: string;
  children?: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {suffix && <span className="ml-1 font-normal normal-case tracking-normal">({suffix})</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Text({ name, defaultValue, placeholder }: { name: string; defaultValue?: string; placeholder?: string }) {
  return <input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} className="field" />;
}

function Num({
  name,
  defaultValue,
  step = "any",
  placeholder,
}: {
  name: string;
  defaultValue?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <input
      id={name}
      name={name}
      type="number"
      step={step}
      min="0"
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className="field"
    />
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select id={name} name={name} defaultValue={defaultValue ?? ""} className="field">
      <option value="">—</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function YesNo({ name, defaultValue }: { name: string; defaultValue?: boolean }) {
  return (
    <Select
      name={name}
      defaultValue={defaultValue === undefined ? "" : defaultValue ? "yes" : "no"}
      options={[
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ]}
    />
  );
}

export function JobForm({
  action,
  project,
  submitLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  project?: DeckProject;
  submitLabel: string;
}) {
  const p = project;

  return (
    <form action={action} className="grid gap-5">
      <Section title="The job">
        <Field label="Job name" name="name">
          <Text name="name" defaultValue={p?.name} placeholder="Willis deck" />
        </Field>
        <Field label="Client" name="clientName">
          <Text name="clientName" defaultValue={p?.clientName} placeholder="Optional" />
        </Field>
        <Field label="Address" name="address">
          <Text name="address" defaultValue={p?.address} placeholder="Street, city" />
        </Field>
        <Field label="Jurisdiction" name="jurisdiction">
          <Select
            name="jurisdiction"
            defaultValue={p?.jurisdiction ?? "cincinnati-oh"}
            options={JURISDICTIONS.map((j) => ({ value: j.id, label: `${j.name}, ${j.state}` }))}
          />
        </Field>
      </Section>

      <Section title="Size" hint="Overall footprint and how high the walking surface sits above grade.">
        <Field label="Deck length" name="deckLength" suffix="ft">
          <Num name="deckLength" defaultValue={p?.deckLength} />
        </Field>
        <Field label="Deck width" name="deckWidth" suffix="ft">
          <Num name="deckWidth" defaultValue={p?.deckWidth} />
        </Field>
        <Field label="Height above grade" name="deckHeightIn" suffix="in">
          <Num name="deckHeightIn" defaultValue={p?.deckHeightIn} />
        </Field>
      </Section>

      <Section
        title="Framing"
        hint="No lumber-species field, on purpose — General Note 2 already sets it at No. 2 Southern Pine or better, which is why the city's table has no species column."
      >
        <Field label="Span configuration" name="spanConfiguration">
          <Select
            name="spanConfiguration"
            defaultValue={p?.spanConfiguration}
            options={[
              { value: "single_span", label: "Single-span" },
              { value: "multi_span", label: "Multi-span" },
            ]}
          />
        </Field>
        <Field label="Joist size" name="joistSize">
          <Select
            name="joistSize"
            defaultValue={p?.joistSize}
            options={["2x6", "2x8", "2x10", "2x12"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="Joist spacing" name="joistSpacingIn" suffix="in o.c.">
          <Select
            name="joistSpacingIn"
            defaultValue={p?.joistSpacingIn?.toString()}
            options={["12", "16", "24"].map((v) => ({ value: v, label: `${v}" o.c.` }))}
          />
        </Field>
        <Field label="Joist span" name="joistSpanFt" suffix="ft, clear [A]">
          <Num name="joistSpanFt" defaultValue={p?.joistSpanFt} />
        </Field>
        <Field label="Beam size" name="beamSize">
          <Select
            name="beamSize"
            defaultValue={p?.beamSize}
            options={["(2) 2x6", "(2) 2x8", "(2) 2x10", "(2) 2x12"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="Beam span" name="beamSpanFt" suffix="ft [B]">
          <Num name="beamSpanFt" defaultValue={p?.beamSpanFt} />
        </Field>
        <Field label="Post size" name="postSize">
          <Select
            name="postSize"
            defaultValue={p?.postSize}
            options={["4x4", "4x6", "6x6"].map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="Post spacing" name="postSpacingFt" suffix="ft">
          <Num name="postSpacingFt" defaultValue={p?.postSpacingFt} />
        </Field>
        <Field label="Beam overhang" name="beamOverhangIn" suffix="in past column">
          <Num name="beamOverhangIn" defaultValue={p?.beamOverhangIn} />
        </Field>
        <Field label="Joist overhang" name="joistOverhangIn" suffix="in past column">
          <Num name="joistOverhangIn" defaultValue={p?.joistOverhangIn} />
        </Field>
        <Field label="2x4 diagonal brace at joists" name="hasDiagonalBrace">
          <YesNo name="hasDiagonalBrace" defaultValue={p?.hasDiagonalBrace} />
        </Field>
        <Field label="6x6 bracing at posts" name="hasPostBracing">
          <YesNo name="hasPostBracing" defaultValue={p?.hasPostBracing} />
        </Field>
      </Section>

      <Section title="Attachment" hint="How the deck ties to the house — or whether it stands on its own.">
        <Field label="Attachment" name="attachment">
          <Select
            name="attachment"
            defaultValue={p?.attachment}
            options={[
              { value: "ledger", label: "Ledger to house" },
              { value: "freestanding", label: "Freestanding" },
            ]}
          />
        </Field>
        <Field label="House wall" name="wallCladding">
          <Select
            name="wallCladding"
            defaultValue={p?.wallCladding}
            options={[
              { value: "siding", label: "Siding" },
              { value: "brick_veneer", label: "Brick veneer" },
              { value: "brick_block", label: "Brick / block" },
              { value: "concrete", label: "Concrete" },
            ]}
          />
        </Field>
        <Field label="Ledger bolt spacing" name="ledgerBoltSpacingIn" suffix="in o.c.">
          <Num name="ledgerBoltSpacingIn" defaultValue={p?.ledgerBoltSpacingIn} />
        </Field>
      </Section>

      <Section title="Footings">
        <Field label="Footing diameter" name="footingDiameterIn" suffix="in [C]">
          <Num name="footingDiameterIn" defaultValue={p?.footingDiameterIn} />
        </Field>
        <Field label="Footing thickness" name="footingThicknessIn" suffix="in [D]">
          <Num name="footingThicknessIn" defaultValue={p?.footingThicknessIn} />
        </Field>
        <Field label="Footing depth below grade" name="footingDepthIn" suffix="in">
          <Num name="footingDepthIn" defaultValue={p?.footingDepthIn} />
        </Field>
      </Section>

      <Section title="Guards">
        <Field label="Guard height" name="guardHeightIn" suffix="in">
          <Num name="guardHeightIn" defaultValue={p?.guardHeightIn} />
        </Field>
        <Field label="Guard opening" name="guardOpeningIn" suffix="in">
          <Num name="guardOpeningIn" defaultValue={p?.guardOpeningIn} />
        </Field>
        <Field label="Guard post spacing" name="guardPostSpacingFt" suffix="ft o.c.">
          <Num name="guardPostSpacingFt" defaultValue={p?.guardPostSpacingFt} />
        </Field>
      </Section>

      <Section title="Stairs">
        <Field label="Stairs on this deck" name="hasStairs">
          <YesNo name="hasStairs" defaultValue={p?.hasStairs} />
        </Field>
        <Field label="Number of risers" name="stairRisers">
          <Num name="stairRisers" defaultValue={p?.stairRisers} step="1" />
        </Field>
        <Field label="Riser height" name="riserHeightIn" suffix="in">
          <Num name="riserHeightIn" defaultValue={p?.riserHeightIn} />
        </Field>
        <Field label="Tread depth" name="treadDepthIn" suffix="in">
          <Num name="treadDepthIn" defaultValue={p?.treadDepthIn} />
        </Field>
        <Field label="Stair width" name="stairWidthIn" suffix="in">
          <Num name="stairWidthIn" defaultValue={p?.stairWidthIn} />
        </Field>
        <Field label="Handrail shown" name="hasHandrail">
          <YesNo name="hasHandrail" defaultValue={p?.hasHandrail} />
        </Field>
        <Field label="Handrail height" name="handrailHeightIn" suffix="in above nosing">
          <Num name="handrailHeightIn" defaultValue={p?.handrailHeightIn} />
        </Field>
      </Section>

      <Section title="Loading" hint="The city's stock deck drawings are not designed for spa loading.">
        <Field label="Hot tub or spa on the deck" name="hasHotTub">
          <YesNo name="hasHotTub" defaultValue={p?.hasHotTub} />
        </Field>
      </Section>

      <Section
        title="The property"
        hint="A deck can be framed perfectly and still be refused on where it sits or what the property is."
      >
        <Field label="Historic-designated property" name="inHistoricDistrict">
          <YesNo name="inHistoricDistrict" defaultValue={p?.inHistoricDistrict} />
        </Field>
        <Field label="In the floodplain" name="inFloodplain">
          <YesNo name="inFloodplain" defaultValue={p?.inFloodplain} />
        </Field>
      </Section>

      <Section
        title="Other trades on this job"
        hint="Scope that pulls a separate permit alongside the deck."
      >
        <Field label="Lighting, receptacles or wiring" name="hasElectrical">
          <YesNo name="hasElectrical" defaultValue={p?.hasElectrical} />
        </Field>
        <Field label="Gas or water run to the deck" name="hasPlumbing">
          <YesNo name="hasPlumbing" defaultValue={p?.hasPlumbing} />
        </Field>
        <Field label="HVAC or gas appliance" name="hasMechanical">
          <YesNo name="hasMechanical" defaultValue={p?.hasMechanical} />
        </Field>
      </Section>

      <section className="card p-5">
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea id="notes" name="notes" rows={3} defaultValue={p?.notes} className="field mt-1.5" />
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded bg-gold px-5 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110"
        >
          {submitLabel}
        </button>
        <p className="text-[12px] text-ink-muted">
          The engine runs the moment you save. Nothing is submitted to the city from here.
        </p>
      </div>
    </form>
  );
}
