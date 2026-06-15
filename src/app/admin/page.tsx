import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { groupByDate } from "@/lib/dates";
import AdminMatchRow, {
  type AdminMatch,
  type TeamOpt,
} from "@/components/AdminMatchRow";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
    prisma.team.findMany({ orderBy: [{ groupName: "asc" }, { name: "asc" }] }),
  ]);

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

  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="text-2xl font-extrabold">Panel admin</h1>
        <p className="text-muted mt-1 text-sm">
          Ingresa los resultados reales. Al guardar se recalculan los puntos y
          se llenan los cruces siguientes. En 16avos primero asigna los equipos
          que clasificaron.
        </p>
      </header>

      {groupByDate(rows).map((g) => (
        <section key={g.key}>
          <h2 className="text-lg font-bold mb-3">{g.label}</h2>
          <div className="grid lg:grid-cols-2 gap-3">
            {g.items.map((r) => (
              <AdminMatchRow key={r.id} match={r} teams={teamOpts} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
