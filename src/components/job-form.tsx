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
      <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
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
        hint="Cincinnati does not ask for lumber species — General Note 2 already sets it at No. 2 Southern Pine or better."
      >
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
        <Field label="Joist span" name="joistSpanFt" suffix="ft, clear">
          <Num name="joistSpanFt" defaultValue={p?.joistSpanFt} />
        </Field>
        <Field label="Beam span" name="beamSpanFt" suffix="ft">
          <Num name="beamSpanFt" defaultValue={p?.beamSpanFt} />
        </Field>
        <Field label="Post size" name="postSize">
          <Select
            name="postSize"
            defaultValue={p?.postSize}
            options={[
              { value: "4x4", label: "4x4" },
              { value: "6x6", label: "6x6" },
            ]}
          />
        </Field>
        <Field label="Post spacing" name="postSpacingFt" suffix="ft">
          <Num name="postSpacingFt" defaultValue={p?.postSpacingFt} />
        </Field>
        <Field label="Corner bracing shown" name="hasCornerBracing">
          <YesNo name="hasCornerBracing" defaultValue={p?.hasCornerBracing} />
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
              { value: "wood_siding", label: "Wood siding" },
              { value: "vinyl_siding", label: "Vinyl siding" },
              { value: "fiber_cement", label: "Fiber cement" },
              { value: "brick_veneer", label: "Brick veneer" },
              { value: "stucco", label: "Stucco" },
            ]}
          />
        </Field>
      </Section>

      <Section title="Footings">
        <Field label="Footing diameter" name="footingDiameterIn" suffix="in">
          <Num name="footingDiameterIn" defaultValue={p?.footingDiameterIn} />
        </Field>
        <Field label="Footing depth" name="footingDepthIn" suffix="in">
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
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {submitLabel}
        </button>
        <p className="text-xs text-muted">
          The engine runs the moment you save. Nothing is submitted to the city from here.
        </p>
      </div>
    </form>
  );
}
