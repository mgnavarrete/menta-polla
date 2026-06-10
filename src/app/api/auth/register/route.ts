import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { serializeSession, COOKIE_NAME } from "@/lib/auth";

// Crea una cuenta nueva (jugador) y deja la sesión iniciada.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const pin = String(body.pin ?? "");

  if (name.length < 2 || name.length > 20) {
    return NextResponse.json(
      { error: "El nombre debe tener entre 2 y 20 caracteres" },
      { status: 400 }
    );
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return NextResponse.json(
      { error: "El PIN debe ser de 4 a 8 dígitos" },
      { status: 400 }
    );
  }

  // nombre único (sin distinguir mayúsculas/espacios)
  const existing = await prisma.user.findFirst({
    where: { name: { equals: name } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ese nombre ya está tomado, elige otro" },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: { name, pinHash: bcrypt.hashSync(pin, 10), isAdmin: false },
  });

  const token = serializeSession({
    userId: user.id,
    name: user.name,
    isAdmin: user.isAdmin,
  });
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });

  return NextResponse.json({ ok: true });
}
