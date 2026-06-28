import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFinalStandings, type FinalStandings } from "@/lib/data";
import { PHASES } from "@/lib/bracket";
import AdminPhaseTabs from "@/components/AdminPhaseTabs";
import AdminPhaseLocks, { type UserLocks } from "@/components/AdminPhaseLocks";
import type {
  AdminMatch,
  MatchSuggest,
  SideSuggest,
  TeamOpt,
} from "@/components/AdminMatchRow";

export const dynamic = "force-dynamic";

// Construye la sugerencia de un lado del cruce de 16avos a partir de su etiqueta
// ("2º A", "1º E", "3º (A/B/C/D/F)") y la tabla final de grupos.
function sideSuggest(side: string, fs: FinalStandings): SideSuggest {
  const label = side.trim();
  const det = label.match(/^(\d)º\s+([A-L])/);
  if (det) {
    const pos = Number(det[1]);
    const st = fs.byGroup[det[2]]?.[pos - 1];
    return {
      // solo preseleccionamos si la tabla ya es final (posiciones definitivas)
      teamId: fs.complete ? (st?.team.id ?? null) : null,
      preferredIds: st ? [st.team.id] : [],
      label,
    };
  }
  // lado de "tercero": los grupos válidos vienen entre paréntesis
  const allowed = label
    .match(/\(([^)]+)\)/)?.[1]
    ?.split("/")
    .map((s) => s.trim());
  const thirds = allowed
    ? fs.thirds.filter((t) => allowed.includes(t.groupName))
    : fs.thirds;
  return { teamId: null, preferredIds: thirds.map((t) => t.team.id), label };
}

export default async function AdminPage() {
  await requireAdmin();

  const [matches, teams, standings, users] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
    getFinalStandings(),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { phaseLocks: true },
    }),
  ]);

  // fases cerradas por cada usuario, ordenadas según el orden del torneo
  const userLocks: UserLocks[] = users.map((u) => ({
    userId: u.id,
    name: u.name,
    phases: PHASES.filter((p) => u.phaseLocks.some((l) => l.phase === p)),
  }));

  const teamOpts: TeamOpt[] = teams.map((t) => ({
    id: t.id,
    name: t.name,
    flag: t.flag,
    groupName: t.groupName,
  }));

  const rows: AdminMatch[] = matches.map((m) => ({
    id: m.id,
    matchNo: m.matchNo,
    phase: m.phase,
    groupName: m.groupName,
    slotLabel: m.slotLabel,
    kickoff: m.kickoff.toISOString(),
    status: m.status,
    homeId: m.homeTeamId,
    awayId: m.awayTeamId,
    homeName: m.homeTeam?.name ?? null,
    awayName: m.awayTeam?.name ?? null,
    homeIso: m.homeTeam?.iso ?? null,
    awayIso: m.awayTeam?.iso ?? null,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    winnerTeamId: m.winnerTeamId,
  }));

  // sugerencias de equipos solo para 16avos (R32), parseando su slotLabel
  const suggestions: Record<number, MatchSuggest> = {};
  for (const r of rows) {
    if (r.phase !== "R32" || !r.slotLabel) continue;
    const [h, a] = r.slotLabel.split(/\s+vs\s+/i);
    if (!h || !a) continue;
    suggestions[r.id] = {
      home: sideSuggest(h, standings),
      away: sideSuggest(a, standings),
    };
  }

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-2xl font-extrabold">Panel admin</h1>
        <p className="text-muted mt-1 text-sm">
          Ingresa los resultados reales. Al guardar se recalculan los puntos y
          se llenan los cruces siguientes. En 16avos primero asigna los equipos
          que clasificaron (vienen sugeridos según la tabla final).
        </p>
      </header>

      <AdminPhaseTabs
        rows={rows}
        teams={teamOpts}
        suggestions={suggestions}
        standingsReady={standings.complete}
      />

      <AdminPhaseLocks users={userLocks} />
    </div>
  );
}
