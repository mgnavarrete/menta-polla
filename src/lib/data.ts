import "server-only";
import { prisma } from "./db";
import { PHASES, PHASE_LABEL } from "./bracket";

export type TeamView = {
  id: number;
  name: string;
  code: string;
  flag: string;
  iso: string;
};
export type PredView = {
  userId: number;
  userName: string;
  homeGoals: number;
  awayGoals: number;
  advanceTeamId: number | null;
  points: number;
};
export type MatchView = {
  id: number;
  matchNo: number;
  phase: string;
  groupName: string | null;
  slotLabel: string | null;
  kickoff: string; // ISO
  status: string;
  locked: boolean; // ya empezó (kickoff pasó)
  home: TeamView | null;
  away: TeamView | null;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: number | null;
  myPred: PredView | null;
  others: PredView[]; // predicciones de otros, solo si locked
};

function teamView(
  t: { id: number; name: string; code: string; flag: string; iso: string } | null
): TeamView | null {
  return t
    ? { id: t.id, name: t.name, code: t.code, flag: t.flag, iso: t.iso }
    : null;
}

// Fases que el usuario ya "guardó" (quedan bloqueadas, no se editan más).
export async function getLockedPhases(userId: number): Promise<Set<string>> {
  const locks = await prisma.phaseSubmission.findMany({ where: { userId } });
  return new Set(locks.map((l) => l.phase));
}

// Construye las MatchView para una fase (o un grupo), respetando privacidad:
// las predicciones de los demás solo se revelan una vez empezado el partido.
export async function getMatchViews(
  userId: number,
  filter: { phase?: string; groupName?: string }
): Promise<MatchView[]> {
  const matches = await prisma.match.findMany({
    where: {
      ...(filter.phase ? { phase: filter.phase } : {}),
      ...(filter.groupName ? { groupName: filter.groupName } : {}),
    },
    orderBy: { matchNo: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: { include: { user: true } },
    },
  });

  const now = Date.now();
  return matches.map((m) => {
    const locked = new Date(m.kickoff).getTime() <= now;
    const mine = m.predictions.find((p) => p.userId === userId) ?? null;
    const others = locked
      ? m.predictions
          .filter((p) => p.userId !== userId)
          .map((p) => ({
            userId: p.userId,
            userName: p.user.name,
            homeGoals: p.homeGoals,
            awayGoals: p.awayGoals,
            advanceTeamId: p.advanceTeamId,
            points: p.points,
          }))
      : [];
    return {
      id: m.id,
      matchNo: m.matchNo,
      phase: m.phase,
      groupName: m.groupName,
      slotLabel: m.slotLabel,
      kickoff: m.kickoff.toISOString(),
      status: m.status,
      locked,
      home: teamView(m.homeTeam),
      away: teamView(m.awayTeam),
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      winnerTeamId: m.winnerTeamId,
      myPred: mine
        ? {
            userId: mine.userId,
            userName: "",
            homeGoals: mine.homeGoals,
            awayGoals: mine.awayGoals,
            advanceTeamId: mine.advanceTeamId,
            points: mine.points,
          }
        : null,
      others,
    };
  });
}

// Pozo acumulado: cuota por jugador registrado. Se lo lleva el ganador.
export type Pozo = { cuota: number; jugadores: number; total: number };
export async function getPozo(): Promise<Pozo> {
  const cuota = Number(process.env.POZO_CUOTA ?? 5000) || 5000;
  const jugadores = await prisma.user.count();
  return { cuota, jugadores, total: cuota * jugadores };
}

export type LeaderRow = {
  userId: number;
  name: string;
  total: number;
  groupPoints: number;
  koPoints: number;
  exactHits: number;
  outcomeHits: number; // partidos donde acertó el resultado (ganador/empate)
};

// Tabla de posiciones de los jugadores.
export async function getLeaderboard(): Promise<LeaderRow[]> {
  const users = await prisma.user.findMany({
    include: { predictions: { include: { match: true } } },
  });
  const rows = users.map((u) => {
    let total = 0;
    let groupPoints = 0;
    let koPoints = 0;
    let exactHits = 0;
    let outcomeHits = 0;
    for (const p of u.predictions) {
      total += p.points;
      if (p.match.phase === "GROUP") groupPoints += p.points;
      else koPoints += p.points;
      const finished =
        p.match.status === "FINISHED" &&
        p.match.homeGoals != null &&
        p.match.awayGoals != null;
      if (finished) {
        if (p.match.homeGoals === p.homeGoals && p.match.awayGoals === p.awayGoals)
          exactHits++;
        const guess = Math.sign(p.homeGoals - p.awayGoals);
        const actual = Math.sign(p.match.homeGoals! - p.match.awayGoals!);
        if (guess === actual) outcomeHits++;
      }
    }
    return {
      userId: u.id,
      name: u.name,
      total,
      groupPoints,
      koPoints,
      exactHits,
      outcomeHits,
    };
  });
  rows.sort((a, b) => b.total - a.total || b.exactHits - a.exactHits);
  return rows;
}

// Fase "en juego" ahora mismo: la primera (en orden) con partidos no finalizados.
// Devuelve null si el torneo ya terminó.
export async function getCurrentPhase(): Promise<string | null> {
  for (const phase of PHASES) {
    const unfinished = await prisma.match.count({
      where: { phase, status: { not: "FINISHED" } },
    });
    if (unfinished > 0) return phase;
  }
  return null;
}

// Progreso de cada jugador en la fase actual: quiénes cerraron su apuesta y
// quiénes tienen al menos un borrador (predicciones cargadas, sin cerrar).
export type PhaseProgress = {
  phase: string | null;
  phaseLabel: string;
  lockedIds: number[]; // cerraron la apuesta de la fase
  draftedIds: number[]; // tienen predicciones de la fase (incluye cerrados)
};

export async function getPhaseProgress(): Promise<PhaseProgress> {
  const phase = await getCurrentPhase();
  if (!phase)
    return { phase: null, phaseLabel: "", lockedIds: [], draftedIds: [] };
  const [subs, preds] = await Promise.all([
    prisma.phaseSubmission.findMany({ where: { phase }, select: { userId: true } }),
    prisma.prediction.findMany({
      where: { match: { phase } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);
  return {
    phase,
    phaseLabel: PHASE_LABEL[phase] ?? phase,
    lockedIds: subs.map((s) => s.userId),
    draftedIds: preds.map((p) => p.userId),
  };
}
