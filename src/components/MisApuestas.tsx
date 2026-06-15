"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchView } from "@/lib/data";
import { byKickoff, dayKey, groupByDate } from "@/lib/dates";
import MatchCard from "./MatchCard";

export default function MisApuestas({
  matches,
  today,
}: {
  matches: MatchView[];
  today: string; // clave YYYY-MM-DD del día de hoy (calculada en el server)
}) {
  const [showAll, setShowAll] = useState(false);

  if (!showAll) {
    // partidos de hoy
    const todays = matches
      .filter((m) => dayKey(m.kickoff) === today)
      .sort(byKickoff);

    return (
      <div className="flex flex-col gap-6">
        {todays.length === 0 ? (
          <div className="card p-4 text-sm text-muted">
            Hoy no hay partidos.{" "}
            <Link href="/grupos" className="text-accent font-semibold">
              Revisa tus apuestas →
            </Link>
          </div>
        ) : (
          <section>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="text-accent">Partidos de hoy</span>
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
          ← Volver a los partidos
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
