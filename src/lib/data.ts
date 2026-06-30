import "server-only";
import { prisma } from "./db";
import { PHASES, PHASE_LABEL, groupStandings } from "./bracket";
import { dayKey, todayKey } from "./dates";

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
  const today = todayKey();
  return matches.map((m) => {
    const locked = new Date(m.kickoff).getTime() <= now;
    // Las predicciones del resto se revelan al empezar el partido O si el
    // partido es HOY (mismo día), aunque aún no sea la hora del pitazo.
    const reveal = locked || dayKey(m.kickoff.toISOString()) === today;
    const mine = m.predictions.find((p) => p.userId === userId) ?? null;
    const others = reveal
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

// --- Tabla FINAL de la fase de grupos (para sugerir cruces de 16avos) ---
export type StandingTeam = {
  team: TeamView;
  groupName: string;
  position: number; // 1 = primero del grupo
};
export type FinalStandings = {
  complete: boolean; // todos los partidos de grupos están finalizados
  byGroup: Record<string, StandingTeam[]>; // ordenados 1º..4º
  thirds: StandingTeam[]; // los terceros de cada grupo, rankeados (mejor primero)
};

// Calcula la tabla final de cada grupo y el ranking de terceros. Sirve para
// que el admin asigne los 16avos con la tabla real ya ordenada delante.
export async function getFinalStandings(): Promise<FinalStandings> {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany({ where: { phase: "GROUP" } }),
  ]);

  const complete =
    matches.length > 0 && matches.every((m) => m.status === "FINISHED");

  const teamById = new Map<number, (typeof teams)[number]>(
    teams.map((t) => [t.id, t])
  );
  const letters = [...new Set(teams.map((t) => t.groupName))].sort();

  const byGroup: Record<string, StandingTeam[]> = {};
  // guardamos el GroupRow del tercero para poder rankearlos entre grupos
  const thirdRows: { st: StandingTeam; points: number; gd: number; gf: number }[] =
    [];

  for (const g of letters) {
    const teamIds = teams.filter((t) => t.groupName === g).map((t) => t.id);
    const rows = groupStandings(
      teamIds,
      matches
        .filter((m) => m.groupName === g)
        .map((m) => ({
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeGoals: m.homeGoals,
          awayGoals: m.awayGoals,
        }))
    );
    byGroup[g] = rows.map((row, i) => ({
      team: teamView(teamById.get(row.teamId)!)!,
      groupName: g,
      position: i + 1,
    }));
    const third = rows[2];
    if (third) {
      thirdRows.push({
        st: byGroup[g][2],
        points: third.points,
        gd: third.gd,
        gf: third.gf,
      });
    }
  }

  thirdRows.sort(
    (a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf
  );

  return { complete, byGroup, thirds: thirdRows.map((t) => t.st) };
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
