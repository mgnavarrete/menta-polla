import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { serializeSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const { name, pin } = await req.json().catch(() => ({}));
  if (!name || !pin) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { name: String(name) } });
  if (!user || !bcrypt.compareSync(String(pin), user.pinHash)) {
    return NextResponse.json(
      { error: "Usuario o PIN incorrecto" },
      { status: 401 }
    );
  }
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
    maxAge: 60 * 60 * 24 * 60, // 60 días
  });
  return NextResponse.json({ ok: true, isAdmin: user.isAdmin });
}
