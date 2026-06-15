// Utilidades de fecha (zona Chile) para agrupar/ordenar partidos por día.
// Sin "server-only": lo usan tanto componentes server como client.

const TZ = "America/Santiago";

// Clave estable de día (YYYY-MM-DD) en horario de Chile, para agrupar.
export function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

// Etiqueta legible del día, ej. "Domingo, 14 de junio".
export function dayLabel(iso: string): string {
  const s = new Date(iso).toLocaleDateString("es-CL", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Clave del día de hoy en horario de Chile.
export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function byKickoff<T extends { kickoff: string }>(a: T, b: T): number {
  return +new Date(a.kickoff) - +new Date(b.kickoff);
}

export type DateGroup<T> = { key: string; label: string; items: T[] };

// Agrupa partidos por día (orden cronológico), cada grupo con su etiqueta.
export function groupByDate<T extends { kickoff: string }>(
  items: T[]
): DateGroup<T>[] {
  const sorted = [...items].sort(byKickoff);
  const map = new Map<string, DateGroup<T>>();
  for (const it of sorted) {
    const key = dayKey(it.kickoff);
    let g = map.get(key);
    if (!g) {
      g = { key, label: dayLabel(it.kickoff), items: [] };
      map.set(key, g);
    }
    g.items.push(it);
  }
  return [...map.values()];
}
