"use client";

import { useState } from "react";
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

export default function AdminMatchRow({
  match,
  teams,
}: {
  match: AdminMatch;
  teams: TeamOpt[];
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
  const [aHome, setAHome] = useState<string>(
    match.homeId != null ? String(match.homeId) : ""
  );
  const [aAway, setAAway] = useState<string>(
    match.awayId != null ? String(match.awayId) : ""
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isDraw = home !== "" && away !== "" && Number(home) === Number(away);

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

  return (
    <div className="card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          #{match.matchNo} ·{" "}
          {match.groupName ? `Grupo ${match.groupName}` : match.slotLabel} ·{" "}
          {new Date(match.kickoff).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "short",
          })}
        </span>
        <span
          className={
            match.status === "FINISHED" ? "text-accent" : "text-muted"
          }
        >
          {match.status === "FINISHED" ? "Finalizado" : "Pendiente"}
        </span>
      </div>

      {/* Asignación de equipos en 16avos */}
      {isR32 && (
        <div className="flex items-center gap-2 text-sm">
          <TeamSelect value={aHome} onChange={setAHome} teams={teams} />
          <span className="text-muted">vs</span>
          <TeamSelect value={aAway} onChange={setAAway} teams={teams} />
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
      )}

      {/* Ingreso de resultado */}
      {hasTeams ? (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="min-w-0 truncate flex items-center gap-1.5">
            <Flag iso={match.homeIso} code={match.homeName} width={20} />
            {match.homeName}
          </span>
          <input
            className="score-input"
            inputMode="numeric"
            value={home}
            onChange={(e) =>
              setHome(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
          />
          <span className="text-muted">-</span>
          <input
            className="score-input"
            inputMode="numeric"
            value={away}
            onChange={(e) =>
              setAway(e.target.value.replace(/\D/g, "").slice(0, 2))
            }
          />
          <span className="min-w-0 truncate flex items-center gap-1.5">
            {match.awayName}
            <Flag iso={match.awayIso} code={match.awayName} width={20} />
          </span>

          {isKO && isDraw && (
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
          )}

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
          {match.status === "FINISHED" && (
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
}: {
  value: string;
  onChange: (v: string) => void;
  teams: TeamOpt[];
}) {
  return (
    <select
      className="bg-surface-2 border border-border rounded-md px-2 py-1 text-xs max-w-[10rem]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— equipo —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.flag} {t.name} ({t.groupName})
        </option>
      ))}
    </select>
  );
}
