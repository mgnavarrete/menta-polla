import { requireSession } from "@/lib/auth";
import { getLeaderboard, getMatchViews, getPozo } from "@/lib/data";
import { SCORING } from "@/lib/scoring";
import Leaderboard from "@/components/Leaderboard";
import Pozo from "@/components/Pozo";
import Flag from "@/components/Flag";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await requireSession();
  const [board, matches, pozo] = await Promise.all([
    getLeaderboard(),
    getMatchViews(session.userId, {}),
    getPozo(),
  ]);

  const finished = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.matchNo - a.matchNo);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-extrabold">Ranking</h1>
        <p className="text-muted mt-1 text-sm">
          Puntaje: resultado <b>{SCORING.outcome}</b> · marcador exacto +
          <b>{SCORING.exact}</b> · goles exactos por equipo +
          <b>{SCORING.teamGoals}</b> c/u · acertar quién avanza +
          <b>{SCORING.advance}</b>.
        </p>
      </header>

      <Pozo {...pozo} />

      <Leaderboard rows={board} meId={session.userId} />

      <section>
        <h2 className="text-lg font-bold mb-3">Partidos finalizados</h2>
        {finished.length === 0 ? (
          <p className="text-muted text-sm">Aún no hay partidos con resultado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {finished.map((m) => {
              const preds = [
                ...(m.myPred
                  ? [
                      {
                        name: `${session.name} (tú)`,
                        h: m.myPred.homeGoals,
                        a: m.myPred.awayGoals,
                        pts: m.myPred.points,
                      },
                    ]
                  : []),
                ...m.others.map((o) => ({
                  name: o.userName,
                  h: o.homeGoals,
                  a: o.awayGoals,
                  pts: o.points,
                })),
              ];
              return (
                <div key={m.id} className="card p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Flag iso={m.home?.iso} code={m.home?.code} width={20} />
                      {m.home?.code}
                      <span className="text-accent font-extrabold mx-1">
                        {m.homeGoals}-{m.awayGoals}
                      </span>
                      {m.away?.code}
                      <Flag iso={m.away?.iso} code={m.away?.code} width={20} />
                    </span>
                    <span className="text-xs text-muted">
                      {m.groupName ? `Grupo ${m.groupName}` : m.slotLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    {preds.map((p, i) => (
                      <span key={i} className="text-muted">
                        {p.name}:{" "}
                        <b className="text-foreground">
                          {p.h}-{p.a}
                        </b>{" "}
                        <span className="text-accent font-semibold">
                          {p.pts} pts
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
