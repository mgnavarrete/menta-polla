"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchView } from "@/lib/data";
import { byKickoff, dayKey, groupByDate, todayKey } from "@/lib/dates";
import MatchCard from "./MatchCard";

const MIN_VISIBLE = 6; // partidos mínimos a mostrar en la vista resumida

export default function MisApuestas({ matches }: { matches: MatchView[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!showAll) {
    const now = Date.now();
    const today = todayKey();

    // partidos de hoy
    const todays = matches
      .filter((m) => dayKey(m.kickoff) === today)
      .sort(byKickoff);

    // próximos (futuros, no de hoy) para rellenar si queda espacio
    const upcoming = matches
      .filter((m) => dayKey(m.kickoff) !== today && +new Date(m.kickoff) > now)
      .sort(byKickoff);

    const fill = upcoming.slice(0, Math.max(0, MIN_VISIBLE - todays.length));

    return (
      <div className="flex flex-col gap-6">
        {todays.length === 0 && fill.length === 0 ? (
          <div className="card p-4 text-sm text-muted">
            No hay partidos próximos.{" "}
            <Link href="/grupos" className="text-accent font-semibold">
              Revisa tus apuestas →
            </Link>
          </div>
        ) : (
          <>
            {todays.length > 0 && (
              <section>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <span className="text-accent">Hoy</span>
                  <span className="text-xs font-normal text-muted">
                    {todays.length} partido{todays.length > 1 ? "s" : ""}
                  </span>
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {todays.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </section>
            )}
            {fill.length > 0 && (
              <section>
                <h3 className="font-bold mb-2 text-muted">Próximos partidos</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {fill.map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
        <div>
          <button
            className="btn-ghost btn text-sm"
            onClick={() => setShowAll(true)}
          >
            Ver todos los partidos
          </button>
        </div>
      </div>
    );
  }

  // vista "todos los partidos", agrupados por fecha (orden cronológico)
  const groups = groupByDate(matches);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          className="btn-ghost btn text-sm"
          onClick={() => setShowAll(false)}
        >
          ← Volver a tus apuestas
        </button>
      </div>
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="font-bold mb-2">{g.label}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.items.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
