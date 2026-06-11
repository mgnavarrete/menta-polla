"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchView, TeamView } from "@/lib/data";
import type { GroupRow } from "@/lib/bracket";
import MatchCard, { type CardValue } from "./MatchCard";
import GroupTable from "./GroupTable";

type GroupBlock = { letter: string; standings: { team: TeamView; row: GroupRow }[] };

function initValues(matches: MatchView[]): Record<number, CardValue> {
  const m: Record<number, CardValue> = {};
  for (const mt of matches) {
    m[mt.id] = mt.myPred
      ? {
          home: String(mt.myPred.homeGoals),
          away: String(mt.myPred.awayGoals),
          advance: mt.myPred.advanceTeamId,
        }
      : { home: "", away: "", advance: null };
  }
  return m;
}

export default function PhaseEditor({
  phase,
  phaseLabel,
  matches,
  locked,
  groups,
}: {
  phase: string;
  phaseLabel: string;
  matches: MatchView[];
  locked: boolean;
  groups?: GroupBlock[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<number, CardValue>>(() =>
    initValues(matches)
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const predictable = matches.filter((m) => m.home && m.away);
  const canEdit = !locked && predictable.length > 0;
  // ¿Hay un borrador guardado (predicciones ya en BD pero fase aún abierta)?
  const predictedCount = predictable.filter((m) => m.myPred).length;
  const hasDraft = !locked && predictedCount > 0;

  function onChange(id: number, v: CardValue) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  const filled = predictable.filter((m) => {
    const v = values[m.id];
    return v && v.home !== "" && v.away !== "";
  }).length;

  // lock=false -> guarda borrador (editable). lock=true -> cierra la apuesta.
  async function save(lock: boolean) {
    if (
      lock &&
      !window.confirm(
        `Vas a CERRAR tu apuesta de ${phaseLabel}. Una vez cerrada NO podrás editarla. ¿Continuar?`
      )
    )
      return;
    setBusy(true);
    setMsg("");
    const predictions = predictable
      .map((m) => ({ m, v: values[m.id] }))
      .filter(({ v }) => v && v.home !== "" && v.away !== "")
      .map(({ m, v }) => ({
        matchId: m.id,
        homeGoals: Number(v.home),
        awayGoals: Number(v.away),
        advanceTeamId: v.advance,
      }));
    const res = await fetch("/api/phase/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, predictions, lock }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "Error al guardar");
    }
  }

  const cardEditable = editing && !locked;

  function renderCard(m: MatchView) {
    return (
      <MatchCard
        key={m.id}
        match={m}
        editable={cardEditable && !!m.home && !!m.away}
        value={values[m.id]}
        onChange={(v) => onChange(m.id, v)}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${editing ? "pb-24" : ""}`}>
      {/* barra de acciones superior */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          {locked ? (
            <span className="inline-flex items-center gap-1.5 text-accent font-semibold">
              ✓ Apuesta cerrada · no editable
            </span>
          ) : editing ? (
            <span className="text-muted">Editando tus predicciones…</span>
          ) : hasDraft ? (
            <span className="text-muted">
              📝 Borrador guardado (<b className="text-foreground">{predictedCount}</b>/
              {predictable.length}). Puedes seguir editando o cerrar la apuesta.
            </span>
          ) : (
            <span className="text-muted">
              {predictable.length === 0
                ? "Aún no hay partidos para predecir."
                : "Pulsa “Editar fase” para anotar tus predicciones."}
            </span>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                className={`btn text-sm ${hasDraft ? "btn-ghost" : ""}`}
                onClick={() => setEditing(true)}
              >
                ✏️ {hasDraft ? "Seguir editando" : "Editar fase"}
              </button>
            )}
            {hasDraft && (
              <button className="btn text-sm" onClick={() => save(true)} disabled={busy}>
                🔒 Cerrar apuesta
              </button>
            )}
          </div>
        )}
      </div>

      {/* contenido */}
      {groups ? (
        <div className="flex flex-col gap-8">
          {groups.map((g) => {
            const gm = matches.filter((m) => m.groupName === g.letter);
            return (
              <section
                key={g.letter}
                className="grid lg:grid-cols-[260px_1fr] gap-4"
              >
                <GroupTable letter={g.letter} rows={g.standings} />
                <div className="grid sm:grid-cols-2 gap-3">
                  {gm.map(renderCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {matches.map(renderCard)}
        </div>
      )}

      {/* barra fija para guardar (siempre visible al editar) */}
      {editing && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-5xl px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
            <div className="text-sm text-muted">
              <b className="text-foreground">{filled}</b>/{predictable.length}{" "}
              <span className="hidden min-[380px]:inline">completados</span>
              {msg && <span className="text-red-500 ml-2">{msg}</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-ghost btn text-sm"
                onClick={() => {
                  setValues(initValues(matches));
                  setEditing(false);
                  setMsg("");
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-ghost btn text-sm"
                onClick={() => save(false)}
                disabled={busy}
              >
                {busy ? "Guardando…" : "💾 Guardar"}
              </button>
              <button
                className="btn text-sm"
                onClick={() => save(true)}
                disabled={busy}
              >
                🔒 Cerrar apuesta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
