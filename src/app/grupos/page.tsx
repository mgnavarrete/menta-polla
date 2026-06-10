import { requireSession } from "@/lib/auth";
import { getMatchViews, getLockedPhases, type TeamView } from "@/lib/data";
import { prisma } from "@/lib/db";
import { groupStandings } from "@/lib/bracket";
import PhaseEditor from "@/components/PhaseEditor";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const session = await requireSession();
  const [matches, teams, locked] = await Promise.all([
    getMatchViews(session.userId, { phase: "GROUP" }),
    prisma.team.findMany({ orderBy: [{ groupName: "asc" }, { id: "asc" }] }),
    getLockedPhases(session.userId),
  ]);

  const letters = [...new Set(teams.map((t) => t.groupName))].sort();
  const teamById = new Map<number, TeamView>(
    teams.map((t) => [
      t.id,
      { id: t.id, name: t.name, code: t.code, flag: t.flag, iso: t.iso },
    ])
  );

  const groups = letters.map((g) => {
    const groupMatches = matches.filter((m) => m.groupName === g);
    const teamIds = teams.filter((t) => t.groupName === g).map((t) => t.id);
    const standings = groupStandings(
      teamIds,
      groupMatches.map((m) => ({
        homeTeamId: m.home?.id ?? null,
        awayTeamId: m.away?.id ?? null,
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
      }))
    ).map((row) => ({ team: teamById.get(row.teamId)!, row }));
    return { letter: g, standings };
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold">Fase de grupos</h1>
        <p className="text-muted mt-1 text-sm">
          Pulsa <b>Editar fase</b>, anota el marcador de cada partido y guarda.
          Ojo: una vez que guardas la fase, no se puede volver a editar.
        </p>
      </header>

      <PhaseEditor
        phase="GROUP"
        phaseLabel="la fase de grupos"
        matches={matches}
        locked={locked.has("GROUP")}
        groups={groups}
      />
    </div>
  );
}
