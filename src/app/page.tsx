import { requireSession } from "@/lib/auth";
import { getLeaderboard, getMatchViews, getPozo } from "@/lib/data";
import Leaderboard from "@/components/Leaderboard";
import MisApuestas from "@/components/MisApuestas";
import Pozo from "@/components/Pozo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await requireSession();
  const [board, matches, pozo] = await Promise.all([
    getLeaderboard(),
    getMatchViews(session.userId, {}),
    getPozo(),
  ]);

  const me = board.find((r) => r.userId === session.userId);
  const leader = board[0];
  const myTotal = me?.total ?? 0;
  const myRank = 1 + board.filter((r) => r.total > myTotal).length;
  const tiedTop =
    myRank === 1 && board.filter((r) => r.total === myTotal).length > 1;

  return (
    <div className="flex flex-col gap-7">
      <section>
        <h1 className="text-2xl font-extrabold">Hola, {session.name} 👋</h1>
        <p className="text-muted mt-1">
          {tiedTop
            ? "Empatados en el 1º lugar 🏆 ¡que gane el mejor!"
            : myRank === 1 && myTotal > 0
              ? "Vas primero/a 🏆 ¡a no relajarse!"
              : leader && myTotal < leader.total
                ? `Vas ${leader.total - myTotal} pts atrás de ${leader.name}.`
                : "Anota tus predicciones y a competir."}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-3 sm:p-4">
          <div className="text-muted text-[11px] sm:text-xs">Tus puntos</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-accent">
            {me?.total ?? 0}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-muted text-[11px] sm:text-xs">Exactos</div>
          <div className="text-2xl sm:text-3xl font-extrabold">
            {me?.exactHits ?? 0}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-muted text-[11px] sm:text-xs">Apuestas</div>
          <div className="text-2xl sm:text-3xl font-extrabold">
            {matches.filter((m) => m.myPred).length}
          </div>
        </div>
      </section>

      <Pozo {...pozo} />

      <section>
        <h2 className="text-lg font-bold mb-3">Tabla de posiciones</h2>
        <Leaderboard rows={board} meId={session.userId} />
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Tus apuestas</h2>
        <MisApuestas matches={matches} />
      </section>
    </div>
  );
}
