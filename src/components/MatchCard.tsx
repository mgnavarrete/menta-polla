"use client";

import type { ReactNode } from "react";
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

// Una fila de equipo: bandera + nombre completo + rol (Local/Visita) y, a la
// derecha, el "slot" del marcador (input en edición o número en lectura).
function TeamRow({
  team,
  label,
  role,
  emphasis,
  children,
}: {
  team: TeamView | null;
  label: string;
  role: "Local" | "Visita";
  emphasis?: "win" | "lose" | null;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {team ? (
        <Flag iso={team.iso} code={team.code} width={30} />
      ) : (
        <span
          className="flag inline-flex items-center justify-center text-[11px] text-muted"
          style={{ width: 30, height: 20 }}
        >
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`font-semibold leading-tight ${
            emphasis === "lose" ? "text-muted" : "text-foreground"
          } ${team ? "" : "text-muted"}`}
        >
          {label}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {role}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
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

  const set = (patch: Partial<CardValue>) => onChange?.({ ...v, ...patch });

  // En eliminatorias, si el cruce aún no tiene equipos, mostramos las
  // posiciones de grupo (ej. "1º E vs 3º (A/B/C/D/F)") en lugar del equipo.
  const slotParts = (match.slotLabel ?? "").split(/\s+vs\s+/i);
  const homeLabel = match.home?.name ?? slotParts[0] ?? "Por definir";
  const awayLabel = match.away?.name ?? slotParts[1] ?? "Por definir";

  const mp = match.myPred;
  const finished =
    match.status === "FINISHED" &&
    match.homeGoals != null &&
    match.awayGoals != null;

  // ¿Acertó? exacta (dorado) o solo resultado/ganador-empate (verde).
  const exact =
    finished &&
    mp != null &&
    mp.homeGoals === match.homeGoals &&
    mp.awayGoals === match.awayGoals;
  const outcomeHit =
    finished &&
    mp != null &&
    Math.sign(mp.homeGoals - mp.awayGoals) ===
      Math.sign(match.homeGoals! - match.awayGoals!);

  const advTeam =
    mp?.advanceTeamId === match.home?.id
      ? match.home
      : mp?.advanceTeamId === match.away?.id
        ? match.away
        : null;

  // marco de la tarjeta según el acierto (solo en lectura y partido jugado)
  const cardRing =
    !editable && finished && mp
      ? exact
        ? "ring-2 ring-amber-300"
        : outcomeHit
          ? "ring-2 ring-emerald-300"
          : "ring-1 ring-red-200"
      : "";

  // resultado real por equipo (para resaltar al ganador)
  const homeWin = finished && match.homeGoals! > match.awayGoals!;
  const awayWin = finished && match.awayGoals! > match.homeGoals!;

  function renderScore(side: "home" | "away") {
    if (editable) {
      return (
        <input
          className="score-input"
          inputMode="numeric"
          value={side === "home" ? v.home : v.away}
          onChange={(e) =>
            set({
              [side]: e.target.value.replace(/\D/g, "").slice(0, 2),
            } as Partial<CardValue>)
          }
        />
      );
    }
    if (finished) {
      const g = side === "home" ? match.homeGoals : match.awayGoals;
      const win = side === "home" ? homeWin : awayWin;
      return (
        <span
          className={`inline-flex w-9 justify-center text-xl font-extrabold tabular-nums ${
            win ? "text-foreground" : "text-muted"
          }`}
        >
          {g}
        </span>
      );
    }
    // sin jugar: marcador placeholder
    return <span className="inline-flex w-9 justify-center text-muted">·</span>;
  }

  return (
    <div className={`card p-4 ${cardRing}`}>
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span>
          {match.groupName ? `Grupo ${match.groupName} · ` : ""}
          {fmtDate(match.kickoff)}
        </span>
        {finished ? (
          <span className="text-accent font-semibold">Final</span>
        ) : match.locked ? (
          <span className="text-amber-500 font-semibold">En juego</span>
        ) : null}
      </div>

      {/* equipos: una fila cada uno, nombre completo + Local/Visita */}
      <div className="flex flex-col gap-2.5">
        <TeamRow
          team={match.home}
          label={homeLabel}
          role="Local"
          emphasis={finished ? (homeWin ? "win" : "lose") : null}
        >
          {renderScore("home")}
        </TeamRow>
        <TeamRow
          team={match.away}
          label={awayLabel}
          role="Visita"
          emphasis={finished ? (awayWin ? "win" : "lose") : null}
        >
          {renderScore("away")}
        </TeamRow>
      </div>

      {/* selector de quién avanza (solo si empate en edición de eliminatoria) */}
      {isKO &&
        editable &&
        v.home !== "" &&
        v.away !== "" &&
        Number(v.home) === Number(v.away) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs border-t border-border pt-3">
            <span className="text-muted">Empate · ¿quién avanza?</span>
            {[match.home, match.away].map(
              (t) =>
                t && (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => set({ advance: t.id })}
                    className={`px-2.5 py-1 rounded-md border font-semibold ${
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

      {/* lectura: tu predicción, destacada */}
      {!editable && mp && (
        <PredStrip
          home={mp.homeGoals}
          away={mp.awayGoals}
          advCode={isKO ? advTeam?.code : undefined}
          finished={finished}
          exact={exact}
          outcomeHit={outcomeHit}
          points={mp.points}
        />
      )}

      {!editable && !mp && match.home && match.away && (
        <p className="mt-3 text-xs text-muted">Sin predicción.</p>
      )}
      {!editable && !match.home && (
        <p className="mt-3 text-xs text-muted">
          Se define cuando avancen los equipos.
        </p>
      )}

      {/* predicciones del rival (visibles tras el pitazo) */}
      {!editable && match.others.length > 0 && (
        <div className="mt-3 border-t border-border pt-2.5 flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Resto de la polla
          </span>
          {match.others.map((o) => (
            <div
              key={o.userId}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted">{o.userName}</span>
              <span>
                <b className="text-foreground tabular-nums">
                  {o.homeGoals}-{o.awayGoals}
                </b>
                {finished && (
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

// Franja con la predicción del usuario, grande y con color según el acierto.
function PredStrip({
  home,
  away,
  advCode,
  finished,
  exact,
  outcomeHit,
  points,
}: {
  home: number;
  away: number;
  advCode?: string;
  finished: boolean;
  exact: boolean;
  outcomeHit: boolean;
  points: number;
}) {
  let tone =
    "bg-accent-soft ring-1 ring-emerald-200 text-accent"; // pendiente
  let badge: ReactNode = (
    <span className="text-[11px] font-semibold uppercase tracking-wide">
      Apostado
    </span>
  );
  if (finished) {
    if (exact) {
      tone = "bg-amber-50 ring-1 ring-amber-300 text-amber-800";
      badge = (
        <span className="text-[11px] font-bold uppercase tracking-wide">
          ★ Exacta · +{points}
        </span>
      );
    } else if (outcomeHit) {
      tone = "bg-emerald-50 ring-1 ring-emerald-300 text-emerald-800";
      badge = (
        <span className="text-[11px] font-bold uppercase tracking-wide">
          ✓ Acertaste · +{points}
        </span>
      );
    } else {
      tone = "bg-red-50 ring-1 ring-red-200 text-red-700";
      badge = (
        <span className="text-[11px] font-bold uppercase tracking-wide">
          ✗ +0
        </span>
      );
    }
  }

  return (
    <div
      className={`mt-3 rounded-xl px-3.5 py-2.5 flex items-center justify-between ${tone}`}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
          Tu predicción
        </span>
        <span className="flex items-baseline gap-2">
          <b className="text-2xl font-extrabold tabular-nums leading-none">
            {home} - {away}
          </b>
          {advCode && (
            <span className="text-xs font-semibold opacity-90">
              avanza {advCode}
            </span>
          )}
        </span>
      </div>
      {badge}
    </div>
  );
}
