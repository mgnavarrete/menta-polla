import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recomputeMatchPoints } from "@/lib/engine";

function asGoals(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const matchId = Number(body.matchId);
  const homeGoals = asGoals(body.homeGoals);
  const awayGoals = asGoals(body.awayGoals);
  if (!matchId || homeGoals === null || awayGoals === null) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Partido no existe" }, { status: 404 });
  }
  if (match.homeTeamId == null || match.awayTeamId == null) {
    return NextResponse.json(
      { error: "Este cruce aún no tiene equipos definidos" },
      { status: 400 }
    );
  }
  if (new Date(match.kickoff).getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "El partido ya comenzó, no se puede modificar" },
      { status: 403 }
    );
  }

  // equipo que avanza (solo eliminatorias); debe ser uno de los dos del cruce
  let advanceTeamId: number | null = null;
  if (match.phase !== "GROUP" && body.advanceTeamId != null) {
    const a = Number(body.advanceTeamId);
    if (a === match.homeTeamId || a === match.awayTeamId) advanceTeamId = a;
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.userId, matchId } },
    create: { userId: session.userId, matchId, homeGoals, awayGoals, advanceTeamId },
    update: { homeGoals, awayGoals, advanceTeamId },
  });

  // si por alguna razón el partido ya tiene resultado, recalcular
  if (match.status === "FINISHED") await recomputeMatchPoints(matchId);

  return NextResponse.json({ ok: true });
}
