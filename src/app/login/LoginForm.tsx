"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type Mode = "login" | "register";

export default function LoginForm({ brand }: { brand: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError("");
    setPin("");
    setPin2("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register" && pin !== pin2) {
      setError("Los PIN no coinciden");
      return;
    }

    setLoading(true);
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pin }),
    });
    setLoading(false);

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo continuar");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={submit}
        className="card p-7 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="text-center">
          <span className="wc-logo inline-block">
            <Logo size={52} />
          </span>
          <h1 className="text-2xl font-extrabold mt-1">
            <span className="text-accent">{brand}</span> Polla
          </h1>
          <p className="text-muted text-sm mt-1">Mundial 2026</p>
        </div>

        {/* selector Entrar / Crear cuenta */}
        <div className="grid grid-cols-2 gap-1 bg-surface-2 rounded-xl p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`py-1.5 rounded-lg text-sm font-semibold ${
              mode === "login" ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`py-1.5 rounded-lg text-sm font-semibold ${
              mode === "register" ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <label className="text-sm font-semibold">
          Nombre de usuario
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={20}
            className="mt-1 w-full bg-surface-2 border border-border rounded-lg px-3 py-2"
            placeholder="Tu nombre"
          />
        </label>

        <label className="text-sm font-semibold">
          PIN {mode === "register" && <span className="text-muted font-normal">(4 a 8 dígitos)</span>}
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
            type="password"
            inputMode="numeric"
            className="mt-1 w-full bg-surface-2 border border-border rounded-lg px-3 py-2"
            placeholder="••••"
          />
        </label>

        {mode === "register" && (
          <label className="text-sm font-semibold">
            Repetir PIN
            <input
              value={pin2}
              onChange={(e) =>
                setPin2(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              type="password"
              inputMode="numeric"
              className="mt-1 w-full bg-surface-2 border border-border rounded-lg px-3 py-2"
              placeholder="••••"
            />
          </label>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button className="btn" disabled={loading}>
          {loading
            ? "Cargando…"
            : mode === "login"
              ? "Entrar"
              : "Crear cuenta y entrar"}
        </button>

        <p className="text-center text-xs text-muted">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-accent font-semibold"
              >
                Únete a la polla
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-accent font-semibold"
              >
                Entra aquí
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
