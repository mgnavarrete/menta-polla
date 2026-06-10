import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { recomputeBracket } from "@/lib/engine";

// Asigna equipos a un cruce de 16avos (R32) tras cerrar la fase de grupos.
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
  if (match.phase !== "R32") {
    return NextResponse.json(
      { error: "Solo se asignan equipos en 16avos" },
      { status: 400 }
    );
  }

  const homeTeamId = body.homeTeamId == null ? null : Number(body.homeTeamId);
  const awayTeamId = body.awayTeamId == null ? null : Number(body.awayTeamId);

  await prisma.match.update({
    where: { id: matchId },
    data: { homeTeamId, awayTeamId },
  });
  await recomputeBracket();

  return NextResponse.json({ ok: true });
}
