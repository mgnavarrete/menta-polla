// Reglas de puntaje de la polla. Ajusta estos valores y todo recalcula.
export const SCORING = {
  outcome: 3, // acertar ganador o empate
  exact: 5, // bonus por marcador exacto (adicional al outcome)
  teamGoals: 1, // por cada equipo cuyo nº de goles achuntaste (hasta 2)
  advance: 2, // eliminatorias: acertar quién avanza a la siguiente ronda
};

type Outcome = "H" | "A" | "D";
function outcome(h: number, a: number): Outcome {
  return h > a ? "H" : h < a ? "A" : "D";
}

export type PredInput = {
  homeGoals: number;
  awayGoals: number;
  advanceTeamId: number | null;
};

export type MatchResult = {
  phase: string;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: number | null;
};

export type PointsBreakdown = {
  total: number;
  outcome: number;
  teamGoals: number;
  exact: number;
  advance: number;
};

// Calcula el desglose de puntos de una predicción contra el resultado real.
// Devuelve todo en 0 si el partido aún no tiene marcador.
export function computePoints(
  pred: PredInput,
  match: MatchResult
): PointsBreakdown {
  const empty = { total: 0, outcome: 0, teamGoals: 0, exact: 0, advance: 0 };
  if (match.homeGoals == null || match.awayGoals == null) return empty;

  const b = { ...empty };
  const actual = outcome(match.homeGoals, match.awayGoals);
  const guess = outcome(pred.homeGoals, pred.awayGoals);

  if (guess === actual) b.outcome = SCORING.outcome;
  if (pred.homeGoals === match.homeGoals) b.teamGoals += SCORING.teamGoals;
  if (pred.awayGoals === match.awayGoals) b.teamGoals += SCORING.teamGoals;
  if (
    pred.homeGoals === match.homeGoals &&
    pred.awayGoals === match.awayGoals
  ) {
    b.exact = SCORING.exact;
  }
  if (
    match.phase !== "GROUP" &&
    match.winnerTeamId != null &&
    pred.advanceTeamId === match.winnerTeamId
  ) {
    b.advance = SCORING.advance;
  }

  b.total = b.outcome + b.teamGoals + b.exact + b.advance;
  return b;
}
