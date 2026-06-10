"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/grupos", label: "Grupos" },
  { href: "/eliminatorias/R32", label: "Eliminatorias" },
  { href: "/ranking", label: "Ranking" },
];

export default function Nav({
  name,
  isAdmin,
  brand,
}: {
  name: string;
  isAdmin: boolean;
  brand: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const all = isAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-20">
      <div className="wc-bar" />
      <div className="mx-auto max-w-5xl px-3 sm:px-4">
        {/* fila 1: marca + usuario */}
        <div className="flex items-center justify-between py-2.5">
          <Link
            href="/"
            className="font-extrabold text-lg tracking-tight flex items-center gap-1.5"
          >
            <span className="wc-logo">
              <Logo size={24} />
            </span>
            <span>
              <span className="text-accent">{brand}</span> Polla
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">{name}</span>
            <button
              onClick={logout}
              className="text-sm text-muted hover:text-foreground border border-border rounded-lg px-2 py-1"
            >
              Salir
            </button>
          </div>
        </div>
        {/* fila 2: navegación (scroll horizontal en móvil) */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 -mb-px no-scrollbar">
          {all.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(
                    l.href.split("/").slice(0, 2).join("/")
                  );
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
