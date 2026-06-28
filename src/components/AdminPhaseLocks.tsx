"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PHASE_LABEL } from "@/lib/bracket";

export type UserLocks = {
  userId: number;
  name: string;
  phases: string[]; // fases cerradas (en orden de torneo)
};

// Panel para reabrir una fase cerrada por error. Lista a cada usuario con sus
// fases bloqueadas y un botón para reabrir cada una (borra el candado, sin
// tocar predicciones).
export default function AdminPhaseLocks({ users }: { users: UserLocks[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null); // `${userId}:${phase}`
  const [msg, setMsg] = useState<string>("");

  const withLocks = users.filter((u) => u.phases.length > 0);

  async function reopen(userId: number, name: string, phase: string) {
    const key = `${userId}:${phase}`;
    if (
      !window.confirm(
        `¿Reabrir "${PHASE_LABEL[phase] ?? phase}" para ${name}? ` +
          "Podrá volver a editar y cerrar esa fase. No se borran sus predicciones."
      )
    )
      return;
    setBusy(key);
    setMsg("");
    const res = await fetch("/api/admin/reopen-phase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, phase }),
    });
    setBusy(null);
    if (res.ok) {
      setMsg(`✓ ${name}: ${PHASE_LABEL[phase] ?? phase} reabierta`);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setMsg(d.error ?? "Error");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold">Reabrir fases cerradas</h2>
        <p className="text-muted mt-1 text-sm">
          Si alguien cerró una fase por error, reábrela aquí para que pueda
          volver a editar. No se borran sus predicciones.
        </p>
      </div>

      {withLocks.length === 0 ? (
        <p className="text-sm text-muted">
          Nadie tiene fases cerradas por ahora.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {withLocks.map((u) => (
            <div
              key={u.userId}
              className="card p-3 flex flex-wrap items-center gap-2"
            >
              <span className="font-semibold text-sm mr-1">{u.name}</span>
              {u.phases.map((p) => {
                const key = `${u.userId}:${p}`;
                return (
                  <button
                    key={p}
                    className="btn-ghost btn text-xs"
                    disabled={busy !== null}
                    onClick={() => reopen(u.userId, u.name, p)}
                  >
                    {busy === key ? "…" : `Reabrir ${PHASE_LABEL[p] ?? p}`}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {msg && <span className="text-xs text-muted">{msg}</span>}
    </section>
  );
}
