import "server-only";
import { prisma } from "./db";
import { computePoints } from "./scoring";
import { resolveKnockoutSlot, KO_ORDER, type Phase } from "./bracket";

// Recalcula los puntos de todas las predicciones de un partido.
export async function recomputeMatchPoints(matchId: number) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  const preds = await prisma.prediction.findMany({ where: { matchId } });
  for (const p of preds) {
    const { total } = computePoints(
      {
        homeGoals: p.homeGoals,
        awayGoals: p.awayGoals,
        advanceTeamId: p.advanceTeamId,
      },
      {
        phase: match.phase,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        winnerTeamId: match.winnerTeamId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
      }
    );
    if (total !== p.points) {
      await prisma.prediction.update({
        where: { id: p.id },
        data: { points: total },
      });
    }
  }
}

// Propaga los ganadores de eliminatorias hacia las llaves siguientes
// (8vos -> 4tos -> semis -> final/3er lugar). Los 16avos los asigna el admin.
export async function recomputeBracket() {
  const all = await prisma.match.findMany({ orderBy: { matchNo: "asc" } });
  const byNo = new Map(all.map((m) => [m.matchNo, m]));
  for (const m of all) {
    const resolved = resolveKnockoutSlot(m.matchNo, byNo);
    if (!resolved) continue;
    if (
      resolved.homeTeamId !== m.homeTeamId ||
      resolved.awayTeamId !== m.awayTeamId
    ) {
      const updated = await prisma.match.update({
        where: { id: m.id },
        data: {
          homeTeamId: resolved.homeTeamId,
          awayTeamId: resolved.awayTeamId,
        },
      });
      byNo.set(updated.matchNo, updated);
    }
  }
}

// Indica si una fase eliminatoria está "abierta" para predecir:
// se abre cuando todos los partidos de la fase previa están FINALIZADOS.
export async function isPhaseOpen(phase: Phase): Promise<boolean> {
  const prevByPhase: Record<string, string> = {
    R32: "GROUP",
    R16: "R32",
    QF: "R16",
    SF: "QF",
    THIRD: "SF",
    FINAL: "SF",
  };
  const prev = prevByPhase[phase];
  if (!prev) return true;
  const pending = await prisma.match.count({
    where: { phase: prev, status: { not: "FINISHED" } },
  });
  return pending === 0;
}

export { KO_ORDER };
