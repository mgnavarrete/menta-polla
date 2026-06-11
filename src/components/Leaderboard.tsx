import type { LeaderRow, PhaseProgress } from "@/lib/data";

export default function Leaderboard({
  rows,
  meId,
  progress,
}: {
  rows: LeaderRow[];
  meId: number;
  progress?: PhaseProgress;
}) {
  const showProg = !!progress?.phase;
  const lockedSet = new Set(progress?.lockedIds ?? []);
  const draftedSet = new Set(progress?.draftedIds ?? []);

  return (
    <div className="flex flex-col gap-2">
      {showProg && (
        <p className="text-xs text-muted px-1">
          Predicciones de <b className="text-foreground">{progress!.phaseLabel}</b>:{" "}
          <span className="text-emerald-500 font-semibold">✓ cerrada</span> ·{" "}
          <span className="text-amber-500 font-semibold">✏️ borrador</span> ·{" "}
          <span>⏳ falta</span>
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[340px]">
          <thead>
            <tr className="text-muted text-xs border-b border-border">
              <th className="text-left p-3 font-semibold">#</th>
              <th className="text-left p-3 font-semibold">Jugador</th>
              <th className="text-right p-3 font-semibold">Grupos</th>
              <th className="text-right p-3 font-semibold">Elim.</th>
              <th className="text-right p-3 font-semibold hidden sm:table-cell">
                Exactos
              </th>
              <th className="text-right p-3 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              // posición con empates: mismos puntos => misma posición
              const rank = 1 + rows.filter((o) => o.total > r.total).length;
              const locked = lockedSet.has(r.userId);
              const drafted = draftedSet.has(r.userId);
              return (
                <tr
                  key={r.userId}
                  className={`border-b border-border/60 last:border-0 ${
                    r.userId === meId ? "bg-surface-2/50" : ""
                  }`}
                >
                  <td className="p-3 text-muted">
                    {rank === 1 ? "🏆" : `${rank}º`}
                  </td>
                  <td className="p-3 font-semibold">
                    {showProg &&
                      (locked ? (
                        <span
                          title={`Cerró sus predicciones de ${progress!.phaseLabel}`}
                          className="text-emerald-500 mr-1.5"
                        >
                          ✓
                        </span>
                      ) : drafted ? (
                        <span
                          title="Tiene un borrador, aún no cierra su apuesta"
                          className="mr-1.5"
                        >
                          ✏️
                        </span>
                      ) : (
                        <span
                          title={`Todavía no anota sus predicciones de ${progress!.phaseLabel}`}
                          className="mr-1.5"
                        >
                          ⏳
                        </span>
                      ))}
                    {r.name}
                    {r.userId === meId && (
                      <span className="text-muted font-normal"> (tú)</span>
                    )}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted">
                    {r.groupPoints}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted">
                    {r.koPoints}
                  </td>
                  <td className="p-3 text-right tabular-nums text-muted hidden sm:table-cell">
                    {r.exactHits}
                  </td>
                  <td className="p-3 text-right tabular-nums font-extrabold text-accent">
                    {r.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
