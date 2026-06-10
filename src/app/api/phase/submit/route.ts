import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recomputeMatchPoints } from "@/lib/engine";
import { PHASES } from "@/lib/bracket";

function asGoals(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

// Guarda TODAS las predicciones de una fase y la bloquea (no se puede reeditar).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const phase = String(body.phase ?? "");
  if (!PHASES.includes(phase as never)) {
    return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
  }

  // ¿ya guardó esta fase?
  const already = await prisma.phaseSubmission.findUnique({
    where: { userId_phase: { userId: session.userId, phase } },
  });
  if (already) {
    return NextResponse.json(
      { error: "Esta fase ya fue guardada y no se puede editar" },
      { status: 403 }
    );
  }

  const preds: unknown[] = Array.isArray(body.predictions)
    ? body.predictions
    : [];

  // partidos válidos de la fase (con equipos definidos)
  const matches = await prisma.match.findMany({ where: { phase } });
  const byId = new Map(matches.map((m) => [m.id, m]));

  let saved = 0;
  const finishedTouched: number[] = [];
  for (const raw of preds) {
    const p = raw as Record<string, unknown>;
    const matchId = Number(p.matchId);
    const match = byId.get(matchId);
    if (!match || match.homeTeamId == null || match.awayTeamId == null) continue;
    const homeGoals = asGoals(p.homeGoals);
    const awayGoals = asGoals(p.awayGoals);
    if (homeGoals === null || awayGoals === null) continue;

    let advanceTeamId: number | null = null;
    if (phase !== "GROUP") {
      if (homeGoals > awayGoals) advanceTeamId = match.homeTeamId;
      else if (awayGoals > homeGoals) advanceTeamId = match.awayTeamId;
      else {
        const a = Number(p.advanceTeamId);
        if (a === match.homeTeamId || a === match.awayTeamId) advanceTeamId = a;
      }
    }

    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: session.userId, matchId } },
      create: { userId: session.userId, matchId, homeGoals, awayGoals, advanceTeamId },
      update: { homeGoals, awayGoals, advanceTeamId },
    });
    saved++;
    if (match.status === "FINISHED") finishedTouched.push(matchId);
  }

  // bloquea la fase
  await prisma.phaseSubmission.create({
    data: { userId: session.userId, phase },
  });

  for (const id of finishedTouched) await recomputeMatchPoints(id);

  return NextResponse.json({ ok: true, saved });
}
