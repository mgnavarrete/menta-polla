import { requireSession } from "@/lib/auth";
import { getLeaderboard, getMatchViews, getPozo, getPhaseProgress } from "@/lib/data";
import { SCORING } from "@/lib/scoring";
import Leaderboard from "@/components/Leaderboard";
import Pozo from "@/components/Pozo";
import Flag from "@/components/Flag";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await requireSession();
  const [board, matches, pozo, progress] = await Promise.all([
    getLeaderboard(),
    getMatchViews(session.userId, {}),
    getPozo(),
    getPhaseProgress(),
  ]);

  const finished = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.matchNo - a.matchNo);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-extrabold">Ranking</h1>
      </header>

      <Pozo {...pozo} />

      <section className="card p-4">
        <h2 className="font-bold text-sm mb-2.5">¿Cómo se ganan los puntos?</h2>
        <ul className="text-sm flex flex-col gap-2">
          <li className="flex items-center justify-between gap-3">
            <span>
              🎯 <b>Marcador exacto</b>{" "}
              <span className="text-muted">(achuntar el resultado completo)</span>
            </span>
            <b className="text-accent whitespace-nowrap">{SCORING.exact} pts</b>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>
              ✅ <b>Solo quién gana o empata</b>{" "}
              <span className="text-muted">(sin el marcador exacto)</span>
            </span>
            <b className="text-accent whitespace-nowrap">{SCORING.outcome} pts</b>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>
              🏆 <b>Eliminatorias:</b> acertar quién avanza{" "}
              <span className="text-muted">(extra)</span>
            </span>
            <b className="text-accent whitespace-nowrap">+{SCORING.advance} pts</b>
          </li>
        </ul>
        <p className="text-xs text-muted mt-3 border-t border-border pt-2.5">
          No se suman: si achuntas el exacto ganas {SCORING.exact}, no{" "}
          {SCORING.exact + SCORING.outcome}. Ej.: si el partido va <b>3-1</b> y
          predijiste <b>1-0</b> ganas {SCORING.outcome} (acertaste el ganador); si
          predijiste <b>3-1</b> ganas {SCORING.exact}.
        </p>
      </section>

      <Leaderboard rows={board} meId={session.userId} progress={progress} />

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
