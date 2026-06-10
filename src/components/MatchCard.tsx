"use client";

import type { MatchView, TeamView } from "@/lib/data";
import Flag from "./Flag";

export type CardValue = {
  home: string;
  away: string;
  advance: number | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamTag({
  team,
  label,
  align,
}: {
  team: TeamView | null;
  label: string;
  align: "l" | "r";
}) {
  return (
    <div
      className={`flex items-center gap-2 min-w-0 ${
        align === "r" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {team ? (
        <Flag iso={team.iso} code={team.code} width={24} />
      ) : (
        <span className="flag inline-flex items-center justify-center text-[10px] text-muted" style={{ width: 24, height: 16 }}>
          ?
        </span>
      )}
      <span
        className={`font-semibold truncate text-sm sm:text-base ${
          team ? "" : "text-muted"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function MatchCard({
  match,
  editable = false,
  value,
  onChange,
}: {
  match: MatchView;
  editable?: boolean;
  value?: CardValue;
  onChange?: (v: CardValue) => void;
}) {
  const isKO = match.phase !== "GROUP";
  const v = value ?? { home: "", away: "", advance: null };

  const set = (patch: Partial<CardValue>) =>
    onChange?.({ ...v, ...patch });

  // En eliminatorias, si el cruce aún no tiene equipos, mostramos las
  // posiciones de grupo (ej. "1º E vs 3º (A/B/C/D/F)") en lugar del equipo.
  const slotParts = (match.slotLabel ?? "").split(/\s+vs\s+/i);
  const homeLabel = match.home?.name ?? slotParts[0] ?? "Por definir";
  const awayLabel = match.away?.name ?? slotParts[1] ?? "Por definir";

  const advTeam =
    match.myPred?.advanceTeamId === match.home?.id
      ? match.home
      : match.myPred?.advanceTeamId === match.away?.id
        ? match.away
        : null;

  return (
    <div className="card p-3.5">
      <div className="flex items-center justify-between text-xs text-muted mb-2">
        <span>
          {match.groupName ? `Grupo ${match.groupName} · ` : ""}
          {fmtDate(match.kickoff)}
        </span>
        {match.status === "FINISHED" ? (
          <span className="text-accent font-semibold">Final</span>
        ) : match.locked ? (
          <span className="text-amber-500 font-semibold">En juego</span>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamTag team={match.home} label={homeLabel} align="l" />

        <div className="flex items-center gap-1.5 justify-center">
          {editable ? (
            <>
              <input
                className="score-input"
                inputMode="numeric"
                value={v.home}
                onChange={(e) =>
                  set({ home: e.target.value.replace(/\D/g, "").slice(0, 2) })
                }
              />
              <span className="text-muted">-</span>
              <input
                className="score-input"
                inputMode="numeric"
                value={v.away}
                onChange={(e) =>
                  set({ away: e.target.value.replace(/\D/g, "").slice(0, 2) })
                }
              />
            </>
          ) : (
            <div className="font-extrabold text-lg tabular-nums">
              {match.status === "FINISHED"
                ? `${match.homeGoals} - ${match.awayGoals}`
                : "vs"}
            </div>
          )}
        </div>

        <TeamTag team={match.away} label={awayLabel} align="r" />
      </div>

      {/* selector de quién avanza (solo si empate en edición de eliminatoria) */}
      {isKO && editable && v.home !== "" && v.away !== "" &&
        Number(v.home) === Number(v.away) && (
          <div className="mt-2.5 flex items-center gap-2 text-xs">
            <span className="text-muted">Empate · ¿quién avanza?</span>
            {[match.home, match.away].map(
              (t) =>
                t && (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set({ advance: t.id })}
                    className={`px-2 py-1 rounded-md border ${
                      v.advance === t.id
                        ? "border-accent text-accent bg-accent-soft"
                        : "border-border text-muted"
                    }`}
                  >
                    {t.code}
                  </button>
                )
            )}
          </div>
        )}

      {/* lectura: tu predicción */}
      {!editable && match.myPred && (
        <p className="mt-2 text-xs text-muted">
          Tu predicción:{" "}
          <b className="text-foreground">
            {match.myPred.homeGoals}-{match.myPred.awayGoals}
          </b>
          {isKO && advTeam ? ` · avanza ${advTeam.code}` : ""}
          {match.status === "FINISHED" && (
            <span className="text-accent font-semibold">
              {" "}
              · {match.myPred.points} pts
            </span>
          )}
        </p>
      )}
      {!editable && !match.myPred && match.home && match.away && (
        <p className="mt-2 text-xs text-muted">Sin predicción.</p>
      )}
      {!editable && !match.home && (
        <p className="mt-2 text-xs text-muted">
          Se define cuando avancen los equipos.
        </p>
      )}

      {/* predicciones del rival (visibles tras el pitazo) */}
      {!editable && match.others.length > 0 && (
        <div className="mt-2.5 border-t border-border pt-2 flex flex-col gap-1">
          {match.others.map((o) => (
            <div
              key={o.userId}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted">{o.userName}</span>
              <span>
                <b className="text-foreground">
                  {o.homeGoals}-{o.awayGoals}
                </b>
                {match.status === "FINISHED" && (
                  <span className="text-accent font-semibold">
                    {" "}
                    · {o.points} pts
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
