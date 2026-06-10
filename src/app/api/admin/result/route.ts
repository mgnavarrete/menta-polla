import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recomputeMatchPoints, recomputeBracket } from "@/lib/engine";

function asGoals(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const matchId = Number(body.matchId);
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Partido no existe" }, { status: 404 });
  }

  // Permitir "reabrir" un partido (borrar resultado)
  if (body.clear) {
    await prisma.match.update({
      where: { id: matchId },
      data: { homeGoals: null, awayGoals: null, winnerTeamId: null, status: "SCHEDULED" },
    });
    await recomputeMatchPoints(matchId);
    await recomputeBracket();
    return NextResponse.json({ ok: true });
  }

  const homeGoals = asGoals(body.homeGoals);
  const awayGoals = asGoals(body.awayGoals);
  if (homeGoals === null || awayGoals === null) {
    return NextResponse.json({ error: "Marcador inválido" }, { status: 400 });
  }

  // Para eliminatorias necesitamos saber quién avanza
  let winnerTeamId: number | null = null;
  if (match.phase !== "GROUP") {
    if (homeGoals > awayGoals) winnerTeamId = match.homeTeamId;
    else if (awayGoals > homeGoals) winnerTeamId = match.awayTeamId;
    else {
      // empate -> definido por penales, lo elige el admin
      const w = Number(body.winnerTeamId);
      if (w !== match.homeTeamId && w !== match.awayTeamId) {
        return NextResponse.json(
          { error: "Empate: indica quién gana por penales" },
          { status: 400 }
        );
      }
      winnerTeamId = w;
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeGoals, awayGoals, winnerTeamId, status: "FINISHED" },
  });

  await recomputeMatchPoints(matchId);
  await recomputeBracket();

  return NextResponse.json({ ok: true });
}
