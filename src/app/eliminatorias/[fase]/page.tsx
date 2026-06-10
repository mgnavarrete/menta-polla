import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getMatchViews, getLockedPhases } from "@/lib/data";
import { isPhaseOpen } from "@/lib/engine";
import { PHASE_LABEL, KO_ORDER, type Phase } from "@/lib/bracket";
import PhaseEditor from "@/components/PhaseEditor";

export const dynamic = "force-dynamic";

export default async function EliminatoriasPage({
  params,
}: {
  params: Promise<{ fase: string }>;
}) {
  const { fase } = await params;
  const phase = fase as Phase;
  if (!KO_ORDER.includes(phase)) notFound();

  const session = await requireSession();
  const [matches, open, locked] = await Promise.all([
    getMatchViews(session.userId, { phase }),
    isPhaseOpen(phase),
    getLockedPhases(session.userId),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold">Eliminatorias</h1>
        <p className="text-muted mt-1 text-sm">
          Cada ronda se habilita cuando termina la anterior. Edita la fase,
          guarda una vez y los cruces se llenan con los resultados reales.
        </p>
      </header>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {KO_ORDER.map((p) => (
          <Link
            key={p}
            href={`/eliminatorias/${p}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border whitespace-nowrap shrink-0 ${
              p === phase
                ? "bg-accent-strong text-white border-transparent"
                : "card text-muted hover:text-foreground"
            }`}
          >
            {PHASE_LABEL[p]}
          </Link>
        ))}
      </div>

      {!open && (
        <div className="card p-3 text-sm text-amber-700 bg-amber-50 border-amber-200">
          ⏳ Esta ronda se habilitará cuando termine la fase anterior. Mientras
          tanto puedes mirar el cuadro.
        </div>
      )}

      <PhaseEditor
        phase={phase}
        phaseLabel={PHASE_LABEL[phase]}
        matches={matches}
        locked={locked.has(phase)}
      />
    </div>
  );
}
