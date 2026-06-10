// Lógica de fases: tabla de posiciones de grupos y avance del cuadro eliminatorio.

export const PHASES = ["GROUP", "R32", "R16", "QF", "SF", "THIRD", "FINAL"] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABEL: Record<string, string> = {
  GROUP: "Fase de grupos",
  R32: "16avos de final",
  R16: "8vos de final",
  QF: "Cuartos de final",
  SF: "Semifinales",
  THIRD: "Tercer lugar",
  FINAL: "Final",
};

// orden de fases eliminatorias para habilitación progresiva
export const KO_ORDER: Phase[] = ["R32", "R16", "QF", "SF", "THIRD", "FINAL"];

// --- Tabla de posiciones de un grupo ---
export type GroupRow = {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
};

type MatchLite = {
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
};

// Calcula la tabla de un grupo a partir de los partidos FINALIZADOS.
// Desempate: puntos, diferencia de gol, goles a favor.
export function groupStandings(
  teamIds: number[],
  matches: MatchLite[]
): GroupRow[] {
  const rows = new Map<number, GroupRow>();
  for (const id of teamIds) {
    rows.set(id, {
      teamId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    });
  }
  for (const m of matches) {
    if (
      m.homeTeamId == null ||
      m.awayTeamId == null ||
      m.homeGoals == null ||
      m.awayGoals == null
    )
      continue;
    const h = rows.get(m.homeTeamId);
    const a = rows.get(m.awayTeamId);
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.gf += m.homeGoals;
    h.ga += m.awayGoals;
    a.gf += m.awayGoals;
    a.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) {
      h.won++;
      a.lost++;
      h.points += 3;
    } else if (m.homeGoals < m.awayGoals) {
      a.won++;
      h.lost++;
      a.points += 3;
    } else {
      h.drawn++;
      a.drawn++;
      h.points++;
      a.points++;
    }
  }
  const list = [...rows.values()];
  for (const r of list) r.gd = r.gf - r.ga;
  list.sort(
    (x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf
  );
  return list;
}

// --- Linkage del cuadro eliminatorio ---
// Para cada partido eliminatorio (salvo 16avos, que asigna el admin) define
// de qué partidos previos salen el equipo local y visitante.
type Source = { match: number; take: "W" | "L" }; // ganador o perdedor
type Feed = { home: Source; away: Source };

// Cuadro OFICIAL del Mundial 2026 (cruces por nº de partido).
const W = (match: number): Source => ({ match, take: "W" });
const L = (match: number): Source => ({ match, take: "L" });

export const KNOCKOUT_FEED: Record<number, Feed> = {
  // 8vos (R16)
  89: { home: W(74), away: W(77) },
  90: { home: W(73), away: W(75) },
  91: { home: W(76), away: W(78) },
  92: { home: W(79), away: W(80) },
  93: { home: W(83), away: W(84) },
  94: { home: W(81), away: W(82) },
  95: { home: W(86), away: W(88) },
  96: { home: W(85), away: W(87) },
  // 4tos (QF)
  97: { home: W(89), away: W(90) },
  98: { home: W(93), away: W(94) },
  99: { home: W(91), away: W(92) },
  100: { home: W(95), away: W(96) },
  // Semifinales
  101: { home: W(97), away: W(98) },
  102: { home: W(99), away: W(100) },
  // Tercer lugar (perdedores de semis)
  103: { home: L(101), away: L(102) },
  // Final (ganadores de semis)
  104: { home: W(101), away: W(102) },
};

// Etiquetas de los 16avos: qué posición de grupo se enfrenta (cuadro oficial 2026).
export const R32_SLOTS: Record<number, string> = {
  73: "2º A vs 2º B",
  74: "1º E vs 3º (A/B/C/D/F)",
  75: "1º F vs 2º C",
  76: "1º C vs 2º F",
  77: "1º I vs 3º (C/D/F/G/H)",
  78: "2º E vs 2º I",
  79: "1º A vs 3º (C/E/F/H/I)",
  80: "1º L vs 3º (E/H/I/J/K)",
  81: "1º D vs 3º (B/E/F/I/J)",
  82: "1º G vs 3º (A/E/H/I/J)",
  83: "2º K vs 2º L",
  84: "1º H vs 2º J",
  85: "1º B vs 3º (E/F/G/I/J)",
  86: "1º J vs 2º H",
  87: "1º K vs 3º (D/E/I/J/L)",
  88: "2º D vs 2º G",
};

// Texto del cruce para mostrar (posiciones en 16avos, o "Ganador N" más adelante).
export function knockoutLabel(matchNo: number): string {
  if (R32_SLOTS[matchNo]) return R32_SLOTS[matchNo];
  const f = KNOCKOUT_FEED[matchNo];
  if (!f) return "";
  const part = (s: Source) =>
    `${s.take === "L" ? "Perdedor" : "Ganador"} ${s.match}`;
  return `${part(f.home)} vs ${part(f.away)}`;
}

type ResolvedMatch = {
  matchNo: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  winnerTeamId: number | null;
};

// Dado un partido fuente, devuelve el equipo que pasa (W) o el que cae (L),
// o null si aún no se conoce.
function takeTeam(src: Source, byNo: Map<number, ResolvedMatch>): number | null {
  const m = byNo.get(src.match);
  if (!m || m.winnerTeamId == null) return null;
  if (src.take === "W") return m.winnerTeamId;
  // perdedor = el otro equipo del partido
  if (m.homeTeamId == null || m.awayTeamId == null) return null;
  return m.winnerTeamId === m.homeTeamId ? m.awayTeamId : m.homeTeamId;
}

// Calcula los equipos local/visitante que corresponden a un partido eliminatorio
// (8vos en adelante) según los resultados previos. Devuelve null donde no aplica.
export function resolveKnockoutSlot(
  matchNo: number,
  byNo: Map<number, ResolvedMatch>
): { homeTeamId: number | null; awayTeamId: number | null } | null {
  const f = KNOCKOUT_FEED[matchNo];
  if (!f) return null; // 16avos: lo asigna el admin manualmente
  return {
    homeTeamId: takeTeam(f.home, byNo),
    awayTeamId: takeTeam(f.away, byNo),
  };
}
