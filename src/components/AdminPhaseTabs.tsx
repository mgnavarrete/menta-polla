"use client";

import { useState } from "react";
import { PHASES, PHASE_LABEL } from "@/lib/bracket";
import { groupByDate } from "@/lib/dates";
import AdminMatchRow, {
  type AdminMatch,
  type MatchSuggest,
  type TeamOpt,
} from "./AdminMatchRow";

export default function AdminPhaseTabs({
  rows,
  teams,
  suggestions,
  standingsReady,
}: {
  rows: AdminMatch[];
  teams: TeamOpt[];
  suggestions: Record<number, MatchSuggest>;
  standingsReady: boolean;
}) {
  // fases que efectivamente tienen partidos cargados
  const phases = PHASES.filter((p) => rows.some((r) => r.phase === p));
  const [active, setActive] = useState<string>(phases[0] ?? "GROUP");

  const phaseRows = rows.filter((r) => r.phase === active);
  const groups = groupByDate(phaseRows);

  return (
    <div className="flex flex-col gap-5">
      {/* pestañas por fase */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {phases.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border whitespace-nowrap shrink-0 ${
              p === active
                ? "bg-accent-strong text-white border-transparent"
                : "card text-muted hover:text-foreground"
            }`}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      {/* aviso para 16avos: tabla final lista para asignar */}
      {active === "R32" &&
        (standingsReady ? (
          <div className="card p-3 text-sm text-emerald-700 bg-emerald-50 border-emerald-200">
            ✅ Tabla final lista. Cada cruce ya viene con los equipos sugeridos
            según la tabla de grupos; revisa, ajusta los terceros y pulsa{" "}
            <b>Asignar</b>.
          </div>
        ) : (
          <div className="card p-3 text-sm text-amber-700 bg-amber-50 border-amber-200">
            ⏳ La fase de grupos aún no termina. Las sugerencias de equipos se
            afinan a medida que se cargan los resultados.
          </div>
        ))}

      {/* partidos de la fase, agrupados por fecha */}
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="text-lg font-bold mb-3">{g.label}</h2>
          <div className="grid lg:grid-cols-2 gap-3">
            {g.items.map((r) => (
              <AdminMatchRow
                key={r.id}
                match={r}
                teams={teams}
                suggest={suggestions[r.id]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
