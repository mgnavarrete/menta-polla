"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchView } from "@/lib/data";
import { PHASES, PHASE_LABEL } from "@/lib/bracket";
import MatchCard from "./MatchCard";

export default function MisApuestas({ matches }: { matches: MatchView[] }) {
  const [showAll, setShowAll] = useState(false);

  // apuestas hechas, en el orden en que se juegan los partidos
  const bets = matches
    .filter((m) => m.myPred)
    .sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));

  if (!showAll) {
    return (
      <div className="flex flex-col gap-3">
        {bets.length === 0 ? (
          <div className="card p-4 text-sm text-muted">
            Aún no has hecho apuestas.{" "}
            <Link href="/grupos" className="text-accent font-semibold">
              Ir a la fase de grupos →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {bets.slice(0, 6).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
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

  // vista "todos los partidos por fase", en orden de juego
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
      {PHASES.map((phase) => {
        const phaseMatches = matches
          .filter((m) => m.phase === phase)
          .sort((a, b) => a.matchNo - b.matchNo);
        if (phaseMatches.length === 0) return null;
        return (
          <section key={phase}>
            <h3 className="font-bold mb-2">{PHASE_LABEL[phase]}</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {phaseMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
