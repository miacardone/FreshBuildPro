"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { store } from "@/lib/store";
import { evaluateSafe } from "@/lib/engine/safe";
import { applyOption, solveFraming } from "@/lib/engine/solver";
import type {
  Attachment,
  BeamSize,
  DeckProject,
  JoistSize,
  JoistSpacing,
  PostSize,
  SpanConfiguration,
  WallCladding,
} from "@/lib/engine/types";

function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

function num(fd: FormData, key: string): number | undefined {
  const v = str(fd, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Tri-state: "yes" / "no" / unset. Unset stays undefined so rules can tell the difference. */
function tri(fd: FormData, key: string): boolean | undefined {
  const v = str(fd, key);
  if (v === "yes") return true;
  if (v === "no") return false;
  return undefined;
}

function readDeckFields(fd: FormData): Omit<DeckProject, "id" | "createdAt" | "updatedAt"> {
  return {
    name: str(fd, "name") ?? "Untitled job",
    clientName: str(fd, "clientName"),
    address: str(fd, "address") ?? "",
    jurisdiction: str(fd, "jurisdiction") ?? "cincinnati-oh",
    trade: "deck",

    deckLength: num(fd, "deckLength"),
    deckWidth: num(fd, "deckWidth"),
    deckHeightIn: num(fd, "deckHeightIn"),

    joistSize: str(fd, "joistSize") as JoistSize | undefined,
    joistSpacingIn: num(fd, "joistSpacingIn") as JoistSpacing | undefined,
    joistSpanFt: num(fd, "joistSpanFt"),
    spanConfiguration: str(fd, "spanConfiguration") as SpanConfiguration | undefined,
    beamOverhangIn: num(fd, "beamOverhangIn"),
    joistOverhangIn: num(fd, "joistOverhangIn"),

    beamSize: str(fd, "beamSize") as BeamSize | undefined,
    beamSpanFt: num(fd, "beamSpanFt"),
    postSize: str(fd, "postSize") as PostSize | undefined,
    postSpacingFt: num(fd, "postSpacingFt"),

    footingDiameterIn: num(fd, "footingDiameterIn"),
    footingThicknessIn: num(fd, "footingThicknessIn"),
    footingDepthIn: num(fd, "footingDepthIn"),

    attachment: str(fd, "attachment") as Attachment | undefined,
    wallCladding: str(fd, "wallCladding") as WallCladding | undefined,
    ledgerBoltSpacingIn: num(fd, "ledgerBoltSpacingIn"),

    guardHeightIn: num(fd, "guardHeightIn"),
    guardOpeningIn: num(fd, "guardOpeningIn"),
    guardPostSpacingFt: num(fd, "guardPostSpacingFt"),

    hasStairs: tri(fd, "hasStairs"),
    stairRisers: num(fd, "stairRisers"),
    riserHeightIn: num(fd, "riserHeightIn"),
    treadDepthIn: num(fd, "treadDepthIn"),
    stairWidthIn: num(fd, "stairWidthIn"),
    hasHandrail: tri(fd, "hasHandrail"),
    handrailHeightIn: num(fd, "handrailHeightIn"),

    hasDiagonalBrace: tri(fd, "hasDiagonalBrace"),
    hasPostBracing: tri(fd, "hasPostBracing"),
    hasHotTub: tri(fd, "hasHotTub"),

    inHistoricDistrict: tri(fd, "inHistoricDistrict"),
    inFloodplain: tri(fd, "inFloodplain"),
    hasElectrical: tri(fd, "hasElectrical"),
    hasPlumbing: tri(fd, "hasPlumbing"),
    hasMechanical: tri(fd, "hasMechanical"),

    notes: str(fd, "notes"),
  };
}

export async function createJob(fd: FormData) {
  const project = await store.create(readDeckFields(fd));
  const result = evaluateSafe(project);
  if (result.ok) await store.recordEvaluation(result.evaluation);
  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateJob(id: string, fd: FormData) {
  const project = await store.update(id, readDeckFields(fd));
  const result = evaluateSafe(project);
  if (result.ok) await store.recordEvaluation(result.evaluation);
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

/**
 * Adopt one of the solver's options. The index is into the deterministic
 * ordering solveFraming returns for this project, so the same index always
 * means the same option.
 */
export async function applyFramingOption(id: string, index: number) {
  const project = await store.get(id);
  if (!project) throw new Error(`No project ${id}`);

  const option = solveFraming(project)[index];
  if (!option) throw new Error(`No option ${index} for project ${id}`);

  const updated = await store.update(id, applyOption(project, option));
  const result = evaluateSafe(updated);
  if (result.ok) await store.recordEvaluation(result.evaluation);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}/issues`);
}

export async function deleteJob(id: string) {
  await store.remove(id);
  revalidatePath("/");
  revalidatePath("/projects");
  redirect("/");
}
