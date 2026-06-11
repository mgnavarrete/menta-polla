// Reglas de puntaje de la polla. Ajusta estos valores y todo recalcula.
// Modelo NO acumulativo por marcador: cada partido da SOLO el mayor de los dos
// (o aciertas el exacto, o solo el ganador). En eliminatorias se suma aparte el
// punto por "quién avanza".
export const SCORING = {
  outcome: 2, // acertar solo quién gana o empata (sin el marcador exacto)
  exact: 5, // acertar el marcador EXACTO (reemplaza a outcome, no se suma)
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
  exact: number;
  advance: number;
};

// Calcula el desglose de puntos de una predicción contra el resultado real.
// Devuelve todo en 0 si el partido aún no tiene marcador.
export function computePoints(
  pred: PredInput,
  match: MatchResult
): PointsBreakdown {
  const empty = { total: 0, outcome: 0, exact: 0, advance: 0 };
  if (match.homeGoals == null || match.awayGoals == null) return empty;

  const b = { ...empty };

  // Marcador exacto y "quién ganó" son excluyentes: te llevas SOLO el mayor.
  const isExact =
    pred.homeGoals === match.homeGoals && pred.awayGoals === match.awayGoals;
  if (isExact) {
    b.exact = SCORING.exact; // 5
  } else if (
    outcome(pred.homeGoals, pred.awayGoals) ===
    outcome(match.homeGoals, match.awayGoals)
  ) {
    b.outcome = SCORING.outcome; // 2
  }

  // Punto extra (solo eliminatorias) por acertar quién avanza.
  if (
    match.phase !== "GROUP" &&
    match.winnerTeamId != null &&
    pred.advanceTeamId === match.winnerTeamId
  ) {
    b.advance = SCORING.advance;
  }

  b.total = b.outcome + b.exact + b.advance;
  return b;
}
