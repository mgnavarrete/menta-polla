import type { Pozo as PozoData } from "@/lib/data";

const clp = (n: number) => "$" + n.toLocaleString("es-CL");

// Banner del pozo acumulado: cuota × jugadores registrados, en grande.
export default function Pozo({ cuota, jugadores, total }: PozoData) {
  return (
    <section className="card overflow-hidden p-0 text-center">
      <div className="bg-accent-soft px-5 py-6 sm:py-7">
        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-accent">
          💰 Pozo del ganador
        </div>
        <div className="mt-1 text-5xl sm:text-7xl font-extrabold text-accent tabular-nums leading-none">
          {clp(total)}
        </div>
        <div className="mt-3 text-xs sm:text-sm text-muted">
          {jugadores} {jugadores === 1 ? "jugador" : "jugadores"} ·{" "}
          {clp(cuota)} c/u · se lo lleva el 1º lugar 🏆
        </div>
      </div>
    </section>
  );
}
