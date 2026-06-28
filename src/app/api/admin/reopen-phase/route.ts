import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PHASES } from "@/lib/bracket";

// Reabre una fase para un usuario: borra su candado (PhaseSubmission) para que
// pueda volver a editar y cerrar sus predicciones. NO toca las predicciones ni
// datos de otros usuarios. Solo admin.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Solo admin" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = Number(body.userId);
  const phase = String(body.phase ?? "");
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });
  }
  if (!PHASES.includes(phase as never)) {
    return NextResponse.json({ error: "Fase inválida" }, { status: 400 });
  }

  const lock = await prisma.phaseSubmission.findUnique({
    where: { userId_phase: { userId, phase } },
  });
  if (!lock) {
    return NextResponse.json(
      { error: "El usuario no tiene cerrada esa fase" },
      { status: 404 }
    );
  }

  await prisma.phaseSubmission.delete({ where: { id: lock.id } });

  return NextResponse.json({ ok: true });
}
