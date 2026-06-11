// Actualiza SOLO la fecha/hora (kickoff) de los 104 partidos con el calendario
// oficial del Mundial 2026. No toca equipos ni predicciones existentes.
//
// Grupos: se emparejan por los dos equipos (sin importar local/visita) -> así
//   las predicciones ya hechas siguen válidas; solo cambia el horario.
// Eliminatorias: se emparejan por número de partido (matchNo 73..104).
//
// Las horas del fixture vienen en hora del Reino Unido (BST = UTC+1).
// Se guardan como instante UTC (= UK - 1h). La app muestra en hora de Chile.
//
// Uso (PRODUCCIÓN):
//   DATABASE_URL="file:/var/www/polla-data/prod.db" npx tsx prisma/update-fixture.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Ej: DATABASE_URL=\"file:/var/www/polla-data/prod.db\" npx tsx prisma/update-fixture.ts");
  process.exit(1);
}
console.log("Base de datos:", url);
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// Hora UK (BST, UTC+1) -> instante UTC. Date.UTC normaliza horas negativas,
// así que restar 1 maneja bien el cambio de día (ej. 00:30 UK -> 23:30 UTC día previo).
function ukToUtc(date: string, time: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h - 1, mi, 0));
}

type Fix =
  | { matchNo: number; date: string; ukTime: string; phase: "GROUP"; group: string; home: string; away: string }
  | { matchNo: number; date: string; ukTime: string; phase: string; slot: string };

const FIXTURE: Fix[] = [
  { matchNo: 1, date: "2026-06-11", ukTime: "20:00", phase: "GROUP", group: "A", home: "México", away: "Sudáfrica" },
  { matchNo: 2, date: "2026-06-12", ukTime: "03:00", phase: "GROUP", group: "A", home: "Corea del Sur", away: "Chequia" },
  { matchNo: 3, date: "2026-06-12", ukTime: "20:00", phase: "GROUP", group: "B", home: "Canadá", away: "Bosnia y Herzegovina" },
  { matchNo: 4, date: "2026-06-13", ukTime: "02:00", phase: "GROUP", group: "D", home: "Estados Unidos", away: "Paraguay" },
  { matchNo: 5, date: "2026-06-13", ukTime: "20:00", phase: "GROUP", group: "B", home: "Catar", away: "Suiza" },
  { matchNo: 6, date: "2026-06-13", ukTime: "23:00", phase: "GROUP", group: "C", home: "Brasil", away: "Marruecos" },
  { matchNo: 7, date: "2026-06-14", ukTime: "02:00", phase: "GROUP", group: "C", home: "Haití", away: "Escocia" },
  { matchNo: 8, date: "2026-06-14", ukTime: "05:00", phase: "GROUP", group: "D", home: "Australia", away: "Turquía" },
  { matchNo: 9, date: "2026-06-14", ukTime: "18:00", phase: "GROUP", group: "E", home: "Alemania", away: "Curazao" },
  { matchNo: 10, date: "2026-06-14", ukTime: "21:00", phase: "GROUP", group: "F", home: "Países Bajos", away: "Japón" },
  { matchNo: 11, date: "2026-06-15", ukTime: "00:00", phase: "GROUP", group: "E", home: "Costa de Marfil", away: "Ecuador" },
  { matchNo: 12, date: "2026-06-15", ukTime: "03:00", phase: "GROUP", group: "F", home: "Suecia", away: "Túnez" },
  { matchNo: 13, date: "2026-06-15", ukTime: "17:00", phase: "GROUP", group: "H", home: "España", away: "Cabo Verde" },
  { matchNo: 14, date: "2026-06-15", ukTime: "20:00", phase: "GROUP", group: "G", home: "Bélgica", away: "Egipto" },
  { matchNo: 15, date: "2026-06-15", ukTime: "23:00", phase: "GROUP", group: "H", home: "Arabia Saudita", away: "Uruguay" },
  { matchNo: 16, date: "2026-06-16", ukTime: "02:00", phase: "GROUP", group: "G", home: "Irán", away: "Nueva Zelanda" },
  { matchNo: 17, date: "2026-06-16", ukTime: "20:00", phase: "GROUP", group: "I", home: "Francia", away: "Senegal" },
  { matchNo: 18, date: "2026-06-16", ukTime: "23:00", phase: "GROUP", group: "I", home: "Irak", away: "Noruega" },
  { matchNo: 19, date: "2026-06-17", ukTime: "02:00", phase: "GROUP", group: "J", home: "Argentina", away: "Argelia" },
  { matchNo: 20, date: "2026-06-17", ukTime: "05:00", phase: "GROUP", group: "J", home: "Austria", away: "Jordania" },
  { matchNo: 21, date: "2026-06-17", ukTime: "18:00", phase: "GROUP", group: "K", home: "Portugal", away: "RD del Congo" },
  { matchNo: 22, date: "2026-06-17", ukTime: "21:00", phase: "GROUP", group: "L", home: "Inglaterra", away: "Croacia" },
  { matchNo: 23, date: "2026-06-18", ukTime: "00:00", phase: "GROUP", group: "L", home: "Ghana", away: "Panamá" },
  { matchNo: 24, date: "2026-06-18", ukTime: "03:00", phase: "GROUP", group: "K", home: "Uzbekistán", away: "Colombia" },
  { matchNo: 25, date: "2026-06-18", ukTime: "17:00", phase: "GROUP", group: "A", home: "Chequia", away: "Sudáfrica" },
  { matchNo: 26, date: "2026-06-18", ukTime: "20:00", phase: "GROUP", group: "B", home: "Suiza", away: "Bosnia y Herzegovina" },
  { matchNo: 27, date: "2026-06-18", ukTime: "23:00", phase: "GROUP", group: "B", home: "Canadá", away: "Catar" },
  { matchNo: 28, date: "2026-06-19", ukTime: "02:00", phase: "GROUP", group: "A", home: "México", away: "Corea del Sur" },
  { matchNo: 29, date: "2026-06-19", ukTime: "20:00", phase: "GROUP", group: "D", home: "Estados Unidos", away: "Australia" },
  { matchNo: 30, date: "2026-06-19", ukTime: "23:00", phase: "GROUP", group: "C", home: "Escocia", away: "Marruecos" },
  { matchNo: 31, date: "2026-06-20", ukTime: "01:30", phase: "GROUP", group: "C", home: "Brasil", away: "Haití" },
  { matchNo: 32, date: "2026-06-20", ukTime: "04:00", phase: "GROUP", group: "D", home: "Turquía", away: "Paraguay" },
  { matchNo: 33, date: "2026-06-20", ukTime: "18:00", phase: "GROUP", group: "F", home: "Países Bajos", away: "Suecia" },
  { matchNo: 34, date: "2026-06-20", ukTime: "21:00", phase: "GROUP", group: "E", home: "Alemania", away: "Costa de Marfil" },
  { matchNo: 35, date: "2026-06-21", ukTime: "01:00", phase: "GROUP", group: "E", home: "Ecuador", away: "Curazao" },
  { matchNo: 36, date: "2026-06-21", ukTime: "05:00", phase: "GROUP", group: "F", home: "Túnez", away: "Japón" },
  { matchNo: 37, date: "2026-06-21", ukTime: "17:00", phase: "GROUP", group: "H", home: "España", away: "Arabia Saudita" },
  { matchNo: 38, date: "2026-06-21", ukTime: "20:00", phase: "GROUP", group: "G", home: "Bélgica", away: "Irán" },
  { matchNo: 39, date: "2026-06-21", ukTime: "23:00", phase: "GROUP", group: "H", home: "Uruguay", away: "Cabo Verde" },
  { matchNo: 40, date: "2026-06-22", ukTime: "02:00", phase: "GROUP", group: "G", home: "Nueva Zelanda", away: "Egipto" },
  { matchNo: 41, date: "2026-06-22", ukTime: "18:00", phase: "GROUP", group: "J", home: "Argentina", away: "Austria" },
  { matchNo: 42, date: "2026-06-22", ukTime: "22:00", phase: "GROUP", group: "I", home: "Francia", away: "Irak" },
  { matchNo: 43, date: "2026-06-23", ukTime: "01:00", phase: "GROUP", group: "I", home: "Noruega", away: "Senegal" },
  { matchNo: 44, date: "2026-06-23", ukTime: "04:00", phase: "GROUP", group: "J", home: "Jordania", away: "Argelia" },
  { matchNo: 45, date: "2026-06-23", ukTime: "18:00", phase: "GROUP", group: "K", home: "Portugal", away: "Uzbekistán" },
  { matchNo: 46, date: "2026-06-23", ukTime: "21:00", phase: "GROUP", group: "L", home: "Inglaterra", away: "Ghana" },
  { matchNo: 47, date: "2026-06-24", ukTime: "00:00", phase: "GROUP", group: "L", home: "Panamá", away: "Croacia" },
  { matchNo: 48, date: "2026-06-24", ukTime: "03:00", phase: "GROUP", group: "K", home: "Colombia", away: "RD del Congo" },
  { matchNo: 49, date: "2026-06-24", ukTime: "20:00", phase: "GROUP", group: "B", home: "Suiza", away: "Canadá" },
  { matchNo: 50, date: "2026-06-24", ukTime: "20:00", phase: "GROUP", group: "B", home: "Bosnia y Herzegovina", away: "Catar" },
  { matchNo: 51, date: "2026-06-24", ukTime: "23:00", phase: "GROUP", group: "C", home: "Escocia", away: "Brasil" },
  { matchNo: 52, date: "2026-06-24", ukTime: "23:00", phase: "GROUP", group: "C", home: "Marruecos", away: "Haití" },
  { matchNo: 53, date: "2026-06-25", ukTime: "02:00", phase: "GROUP", group: "A", home: "Chequia", away: "México" },
  { matchNo: 54, date: "2026-06-25", ukTime: "02:00", phase: "GROUP", group: "A", home: "Sudáfrica", away: "Corea del Sur" },
  { matchNo: 55, date: "2026-06-25", ukTime: "21:00", phase: "GROUP", group: "E", home: "Ecuador", away: "Alemania" },
  { matchNo: 56, date: "2026-06-25", ukTime: "21:00", phase: "GROUP", group: "E", home: "Curazao", away: "Costa de Marfil" },
  { matchNo: 57, date: "2026-06-26", ukTime: "00:00", phase: "GROUP", group: "F", home: "Japón", away: "Suecia" },
  { matchNo: 58, date: "2026-06-26", ukTime: "00:00", phase: "GROUP", group: "F", home: "Túnez", away: "Países Bajos" },
  { matchNo: 59, date: "2026-06-26", ukTime: "03:00", phase: "GROUP", group: "D", home: "Turquía", away: "Estados Unidos" },
  { matchNo: 60, date: "2026-06-26", ukTime: "03:00", phase: "GROUP", group: "D", home: "Paraguay", away: "Australia" },
  { matchNo: 61, date: "2026-06-26", ukTime: "20:00", phase: "GROUP", group: "I", home: "Noruega", away: "Francia" },
  { matchNo: 62, date: "2026-06-26", ukTime: "20:00", phase: "GROUP", group: "I", home: "Senegal", away: "Irak" },
  { matchNo: 63, date: "2026-06-27", ukTime: "01:00", phase: "GROUP", group: "H", home: "Cabo Verde", away: "Arabia Saudita" },
  { matchNo: 64, date: "2026-06-27", ukTime: "01:00", phase: "GROUP", group: "H", home: "Uruguay", away: "España" },
  { matchNo: 65, date: "2026-06-27", ukTime: "04:00", phase: "GROUP", group: "G", home: "Egipto", away: "Irán" },
  { matchNo: 66, date: "2026-06-27", ukTime: "04:00", phase: "GROUP", group: "G", home: "Nueva Zelanda", away: "Bélgica" },
  { matchNo: 67, date: "2026-06-27", ukTime: "22:00", phase: "GROUP", group: "L", home: "Panamá", away: "Inglaterra" },
  { matchNo: 68, date: "2026-06-27", ukTime: "22:00", phase: "GROUP", group: "L", home: "Croacia", away: "Ghana" },
  { matchNo: 69, date: "2026-06-28", ukTime: "00:30", phase: "GROUP", group: "K", home: "Colombia", away: "Portugal" },
  { matchNo: 70, date: "2026-06-28", ukTime: "00:30", phase: "GROUP", group: "K", home: "RD del Congo", away: "Uzbekistán" },
  { matchNo: 71, date: "2026-06-28", ukTime: "03:00", phase: "GROUP", group: "J", home: "Argelia", away: "Austria" },
  { matchNo: 72, date: "2026-06-28", ukTime: "03:00", phase: "GROUP", group: "J", home: "Jordania", away: "Argentina" },
  { matchNo: 73, date: "2026-06-28", ukTime: "20:00", phase: "R32", slot: "2A vs 2B" },
  { matchNo: 74, date: "2026-06-29", ukTime: "21:30", phase: "R32", slot: "1E vs 3(A/B/C/D/F)" },
  { matchNo: 75, date: "2026-06-30", ukTime: "02:00", phase: "R32", slot: "1F vs 2C" },
  { matchNo: 76, date: "2026-06-29", ukTime: "18:00", phase: "R32", slot: "1C vs 2F" },
  { matchNo: 77, date: "2026-06-30", ukTime: "22:00", phase: "R32", slot: "1I vs 3(C/D/F/G/H)" },
  { matchNo: 78, date: "2026-06-30", ukTime: "18:00", phase: "R32", slot: "2E vs 2I" },
  { matchNo: 79, date: "2026-07-01", ukTime: "02:00", phase: "R32", slot: "1A vs 3(C/E/F/H/I)" },
  { matchNo: 80, date: "2026-07-01", ukTime: "17:00", phase: "R32", slot: "1L vs 3(E/H/I/J/K)" },
  { matchNo: 81, date: "2026-07-02", ukTime: "01:00", phase: "R32", slot: "1D vs 3(B/E/F/I/J)" },
  { matchNo: 82, date: "2026-07-01", ukTime: "21:00", phase: "R32", slot: "1G vs 3(A/E/H/I/J)" },
  { matchNo: 83, date: "2026-07-03", ukTime: "00:00", phase: "R32", slot: "2K vs 2L" },
  { matchNo: 84, date: "2026-07-02", ukTime: "20:00", phase: "R32", slot: "1H vs 2J" },
  { matchNo: 85, date: "2026-07-03", ukTime: "04:00", phase: "R32", slot: "1B vs 3(E/F/G/I/J)" },
  { matchNo: 86, date: "2026-07-03", ukTime: "23:00", phase: "R32", slot: "1J vs 2H" },
  { matchNo: 87, date: "2026-07-04", ukTime: "02:30", phase: "R32", slot: "1K vs 3(D/E/I/J/L)" },
  { matchNo: 88, date: "2026-07-03", ukTime: "19:00", phase: "R32", slot: "2D vs 2G" },
  { matchNo: 89, date: "2026-07-04", ukTime: "22:00", phase: "R16", slot: "Ganador 74 vs Ganador 77" },
  { matchNo: 90, date: "2026-07-04", ukTime: "18:00", phase: "R16", slot: "Ganador 73 vs Ganador 75" },
  { matchNo: 91, date: "2026-07-05", ukTime: "21:00", phase: "R16", slot: "Ganador 76 vs Ganador 78" },
  { matchNo: 92, date: "2026-07-06", ukTime: "01:00", phase: "R16", slot: "Ganador 79 vs Ganador 80" },
  { matchNo: 93, date: "2026-07-06", ukTime: "20:00", phase: "R16", slot: "Ganador 83 vs Ganador 84" },
  { matchNo: 94, date: "2026-07-07", ukTime: "01:00", phase: "R16", slot: "Ganador 81 vs Ganador 82" },
  { matchNo: 95, date: "2026-07-07", ukTime: "17:00", phase: "R16", slot: "Ganador 86 vs Ganador 88" },
  { matchNo: 96, date: "2026-07-07", ukTime: "21:00", phase: "R16", slot: "Ganador 85 vs Ganador 87" },
  { matchNo: 97, date: "2026-07-09", ukTime: "21:00", phase: "QF", slot: "Ganador 89 vs Ganador 90" },
  { matchNo: 98, date: "2026-07-10", ukTime: "20:00", phase: "QF", slot: "Ganador 93 vs Ganador 94" },
  { matchNo: 99, date: "2026-07-11", ukTime: "22:00", phase: "QF", slot: "Ganador 91 vs Ganador 92" },
  { matchNo: 100, date: "2026-07-12", ukTime: "02:00", phase: "QF", slot: "Ganador 95 vs Ganador 96" },
  { matchNo: 101, date: "2026-07-14", ukTime: "20:00", phase: "SF", slot: "Ganador 97 vs Ganador 98" },
  { matchNo: 102, date: "2026-07-15", ukTime: "20:00", phase: "SF", slot: "Ganador 99 vs Ganador 100" },
  { matchNo: 103, date: "2026-07-18", ukTime: "22:00", phase: "THIRD", slot: "Perdedor 101 vs Perdedor 102" },
  { matchNo: 104, date: "2026-07-19", ukTime: "20:00", phase: "FINAL", slot: "Ganador 101 vs Ganador 102" },
];

async function main() {
  const teams = await prisma.team.findMany({ select: { id: true, name: true } });
  const idByName = new Map(teams.map((t) => [t.name, t.id]));

  let updated = 0;
  const problemas: string[] = [];

  for (const f of FIXTURE) {
    const kickoff = ukToUtc(f.date, f.ukTime);

    if (f.phase === "GROUP") {
      const hId = idByName.get(f.home);
      const aId = idByName.get(f.away);
      if (!hId || !aId) {
        problemas.push(`Equipo no encontrado en BD: "${f.home}" / "${f.away}" (partido ${f.matchNo})`);
        continue;
      }
      // empareja por el par de equipos sin importar local/visita
      const res = await prisma.match.updateMany({
        where: {
          phase: "GROUP",
          OR: [
            { homeTeamId: hId, awayTeamId: aId },
            { homeTeamId: aId, awayTeamId: hId },
          ],
        },
        data: { kickoff },
      });
      if (res.count === 0) problemas.push(`Sin partido para ${f.home} vs ${f.away}`);
      else if (res.count > 1) problemas.push(`¡${res.count} partidos para ${f.home} vs ${f.away}! (esperaba 1)`);
      updated += res.count;
    } else {
      const res = await prisma.match.updateMany({
        where: { matchNo: f.matchNo },
        data: { kickoff },
      });
      if (res.count === 0) problemas.push(`Sin partido con matchNo ${f.matchNo}`);
      updated += res.count;
    }
  }

  console.log(`\nPartidos actualizados: ${updated} (esperado: 104)`);
  if (problemas.length) {
    console.log(`\n⚠️  PROBLEMAS (${problemas.length}):`);
    for (const p of problemas) console.log("  - " + p);
  } else {
    console.log("✅ Sin problemas. Todos los partidos quedaron con su horario real.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
