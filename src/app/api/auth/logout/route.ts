import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
