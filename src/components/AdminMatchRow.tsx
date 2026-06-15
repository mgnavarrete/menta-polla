"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Flag from "./Flag";

export type TeamOpt = {
  id: number;
  name: string;
  flag: string;
  groupName: string;
};

export type AdminMatch = {
  id: number;
  matchNo: number;
  phase: string;
  groupName: string | null;
  slotLabel: string | null;
  kickoff: string;
  status: string;
  homeId: number | null;
  awayId: number | null;
  homeName: string | null;
  awayName: string | null;
  homeIso: string | null;
  awayIso: string | null;
  homeGoals: number | null;
  awayGoals: number | null;
  winnerTeamId: number | null;
};

// Sugerencia de equipos para un lado del cruce de 16avos, derivada de la tabla
// final de grupos: teamId determinista a preseleccionar (o null) y los ids
// ordenados para mostrar primero los más probables.
export type SideSuggest = {
  teamId: number | null;
  preferredIds: number[];
  label: string; // ej. "2º A" o "3º (A/B/C/D/F)"
};
export type MatchSuggest = { home: SideSuggest; away: SideSuggest };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Fila de equipo al estilo del MatchCard: bandera + nombre + Local/Visita y, a
// la derecha, el input de marcador.
function TeamRow({
  iso,
  name,
  role,
  children,
}: {
  iso: string | null;
  name: string | null;
  role: "Local" | "Visita";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <Flag iso={iso} code={name} width={30} />
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-tight text-foreground truncate">
          {name ?? "Por definir"}
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {role}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function AdminMatchRow({
  match,
  teams,
  suggest,
}: {
  match: AdminMatch;
  teams: TeamOpt[];
  suggest?: MatchSuggest;
}) {
  const router = useRouter();
  const isKO = match.phase !== "GROUP";
  const isR32 = match.phase === "R32";
  const hasTeams = match.homeId != null && match.awayId != null;

  const [home, setHome] = useState(
    match.homeGoals != null ? String(match.homeGoals) : ""
  );
  const [away, setAway] = useState(
    match.awayGoals != null ? String(match.awayGoals) : ""
  );
  const [winner, setWinner] = useState<number | null>(match.winnerTeamId);
  // si el cruce aún no tiene equipo asignado, preselecciona la sugerencia
  // determinista de la tabla final (1º/2º de grupo); los terceros quedan vacíos.
  const [aHome, setAHome] = useState<string>(
    match.homeId != null
      ? String(match.homeId)
      : suggest?.home.teamId != null
        ? String(suggest.home.teamId)
        : ""
  );
  const [aAway, setAAway] = useState<string>(
    match.awayId != null
      ? String(match.awayId)
      : suggest?.away.teamId != null
        ? String(suggest.away.teamId)
        : ""
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);
  const finished = match.status === "FINISHED";

  async function post(url: string, body: object) {
    setBusy(true);
    setMsg("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("✓");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "Error");
    }
  }

  function scoreInput(value: string, onChange: (v: string) => void) {
    return (
      <input
        className="score-input"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 2))}
      />
    );
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* cabecera: grupo/cruce + fecha + estado */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          #{match.matchNo} ·{" "}
          {match.groupName ? `Grupo ${match.groupName}` : match.slotLabel} ·{" "}
          {fmtDate(match.kickoff)}
        </span>
        <span className={finished ? "text-accent font-semibold" : "text-muted"}>
          {finished ? "Finalizado" : "Pendiente"}
        </span>
      </div>

      {/* Asignación de equipos en 16avos */}
      {isR32 && (
        <div className="flex flex-col gap-2 text-sm border-b border-border pb-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex flex-col gap-0.5">
              {suggest && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {suggest.home.label}
                </span>
              )}
              <TeamSelect
                value={aHome}
                onChange={setAHome}
                teams={teams}
                preferredIds={suggest?.home.preferredIds}
              />
            </div>
            <span className="text-muted pb-1.5">vs</span>
            <div className="flex flex-col gap-0.5">
              {suggest && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  {suggest.away.label}
                </span>
              )}
              <TeamSelect
                value={aAway}
                onChange={setAAway}
                teams={teams}
                preferredIds={suggest?.away.preferredIds}
              />
            </div>
            <button
              className="btn-ghost btn text-xs"
              disabled={busy}
              onClick={() =>
                post("/api/admin/assign", {
                  matchId: match.id,
                  homeTeamId: aHome ? Number(aHome) : null,
                  awayTeamId: aAway ? Number(aAway) : null,
                })
              }
            >
              Asignar
            </button>
          </div>
        </div>
      )}

      {hasTeams ? (
        <>
          {/* equipos al estilo MatchCard, con inputs de marcador */}
          <div className="flex flex-col gap-2.5">
            <TeamRow iso={match.homeIso} name={match.homeName} role="Local">
              {scoreInput(home, setHome)}
            </TeamRow>
            <TeamRow iso={match.awayIso} name={match.awayName} role="Visita">
              {scoreInput(away, setAway)}
            </TeamRow>
          </div>

          {/* quién avanza por penales (eliminatorias con empate) */}
          {isKO && isDraw && (
            <div className="flex items-center gap-2 text-xs border-t border-border pt-3">
              <span className="text-muted">Empate · ¿quién avanza?</span>
              <select
                className="bg-surface-2 border border-border rounded-md px-2 py-1 text-xs"
                value={winner ?? ""}
                onChange={(e) =>
                  setWinner(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Gana penales…</option>
                <option value={match.homeId!}>{match.homeName}</option>
                <option value={match.awayId!}>{match.awayName}</option>
              </select>
            </div>
          )}

          {/* acciones */}
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <button
              className="btn text-xs"
              disabled={busy}
              onClick={() =>
                post("/api/admin/result", {
                  matchId: match.id,
                  homeGoals: Number(home),
                  awayGoals: Number(away),
                  winnerTeamId: winner,
                })
              }
            >
              Guardar
            </button>
            {finished && (
              <button
                className="btn-ghost btn text-xs"
                disabled={busy}
                onClick={() =>
                  post("/api/admin/result", { matchId: match.id, clear: true })
                }
              >
                Reabrir
              </button>
            )}
            {msg && <span className="text-xs text-muted">{msg}</span>}
          </div>
        </>
      ) : (
        !isR32 && (
          <p className="text-xs text-muted">
            Cruce por definir (avanzan los ganadores).
          </p>
        )
      )}
    </div>
  );
}

function TeamSelect({
  value,
  onChange,
  teams,
  preferredIds,
}: {
  value: string;
  onChange: (v: string) => void;
  teams: TeamOpt[];
  preferredIds?: number[];
}) {
  const byId = new Map(teams.map((t) => [t.id, t]));
  const preferred = (preferredIds ?? [])
    .map((id) => byId.get(id))
    .filter((t): t is TeamOpt => !!t);
  const preferredSet = new Set(preferred.map((t) => t.id));
  const rest = teams.filter((t) => !preferredSet.has(t.id));
  const opt = (t: TeamOpt) => (
    <option key={t.id} value={t.id}>
      {t.flag} {t.name} ({t.groupName})
    </option>
  );

  return (
    <select
      className="bg-surface-2 border border-border rounded-md px-2 py-1 text-xs max-w-[10rem]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— equipo —</option>
      {preferred.length > 0 ? (
        <>
          <optgroup label="Sugeridos (tabla final)">
            {preferred.map(opt)}
          </optgroup>
          <optgroup label="Todos">{rest.map(opt)}</optgroup>
        </>
      ) : (
        teams.map(opt)
      )}
    </select>
  );
}
