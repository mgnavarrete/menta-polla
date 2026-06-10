import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { knockoutLabel } from "../src/lib/bracket";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

// --- Equipos del Mundial 2026 (sorteo oficial del 5 dic 2025) ---
// Orden por grupo A..L, 4 equipos cada uno.
type TeamSeed = { name: string; code: string; flag: string; iso: string };
const GROUPS: Record<string, TeamSeed[]> = {
  A: [
    { name: "México", code: "MEX", flag: "🇲🇽", iso: "mx" },
    { name: "Sudáfrica", code: "RSA", flag: "🇿🇦", iso: "za" },
    { name: "Corea del Sur", code: "KOR", flag: "🇰🇷", iso: "kr" },
    { name: "Chequia", code: "CZE", flag: "🇨🇿", iso: "cz" },
  ],
  B: [
    { name: "Canadá", code: "CAN", flag: "🇨🇦", iso: "ca" },
    { name: "Bosnia y Herzegovina", code: "BIH", flag: "🇧🇦", iso: "ba" },
    { name: "Catar", code: "QAT", flag: "🇶🇦", iso: "qa" },
    { name: "Suiza", code: "SUI", flag: "🇨🇭", iso: "ch" },
  ],
  C: [
    { name: "Brasil", code: "BRA", flag: "🇧🇷", iso: "br" },
    { name: "Marruecos", code: "MAR", flag: "🇲🇦", iso: "ma" },
    { name: "Haití", code: "HAI", flag: "🇭🇹", iso: "ht" },
    { name: "Escocia", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", iso: "gb-sct" },
  ],
  D: [
    { name: "Estados Unidos", code: "USA", flag: "🇺🇸", iso: "us" },
    { name: "Paraguay", code: "PAR", flag: "🇵🇾", iso: "py" },
    { name: "Australia", code: "AUS", flag: "🇦🇺", iso: "au" },
    { name: "Turquía", code: "TUR", flag: "🇹🇷", iso: "tr" },
  ],
  E: [
    { name: "Alemania", code: "GER", flag: "🇩🇪", iso: "de" },
    { name: "Curazao", code: "CUW", flag: "🇨🇼", iso: "cw" },
    { name: "Costa de Marfil", code: "CIV", flag: "🇨🇮", iso: "ci" },
    { name: "Ecuador", code: "ECU", flag: "🇪🇨", iso: "ec" },
  ],
  F: [
    { name: "Países Bajos", code: "NED", flag: "🇳🇱", iso: "nl" },
    { name: "Japón", code: "JPN", flag: "🇯🇵", iso: "jp" },
    { name: "Suecia", code: "SWE", flag: "🇸🇪", iso: "se" },
    { name: "Túnez", code: "TUN", flag: "🇹🇳", iso: "tn" },
  ],
  G: [
    { name: "Bélgica", code: "BEL", flag: "🇧🇪", iso: "be" },
    { name: "Egipto", code: "EGY", flag: "🇪🇬", iso: "eg" },
    { name: "Irán", code: "IRN", flag: "🇮🇷", iso: "ir" },
    { name: "Nueva Zelanda", code: "NZL", flag: "🇳🇿", iso: "nz" },
  ],
  H: [
    { name: "España", code: "ESP", flag: "🇪🇸", iso: "es" },
    { name: "Cabo Verde", code: "CPV", flag: "🇨🇻", iso: "cv" },
    { name: "Arabia Saudita", code: "KSA", flag: "🇸🇦", iso: "sa" },
    { name: "Uruguay", code: "URU", flag: "🇺🇾", iso: "uy" },
  ],
  I: [
    { name: "Francia", code: "FRA", flag: "🇫🇷", iso: "fr" },
    { name: "Senegal", code: "SEN", flag: "🇸🇳", iso: "sn" },
    { name: "Irak", code: "IRQ", flag: "🇮🇶", iso: "iq" },
    { name: "Noruega", code: "NOR", flag: "🇳🇴", iso: "no" },
  ],
  J: [
    { name: "Argentina", code: "ARG", flag: "🇦🇷", iso: "ar" },
    { name: "Argelia", code: "ALG", flag: "🇩🇿", iso: "dz" },
    { name: "Austria", code: "AUT", flag: "🇦🇹", iso: "at" },
    { name: "Jordania", code: "JOR", flag: "🇯🇴", iso: "jo" },
  ],
  K: [
    { name: "Portugal", code: "POR", flag: "🇵🇹", iso: "pt" },
    { name: "RD del Congo", code: "COD", flag: "🇨🇩", iso: "cd" },
    { name: "Uzbekistán", code: "UZB", flag: "🇺🇿", iso: "uz" },
    { name: "Colombia", code: "COL", flag: "🇨🇴", iso: "co" },
  ],
  L: [
    { name: "Inglaterra", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", iso: "gb-eng" },
    { name: "Croacia", code: "CRO", flag: "🇭🇷", iso: "hr" },
    { name: "Ghana", code: "GHA", flag: "🇬🇭", iso: "gh" },
    { name: "Panamá", code: "PAN", flag: "🇵🇦", iso: "pa" },
  ],
};

// helper para crear fechas UTC
const dt = (day: number, hour: number, month = 5 /* junio */) =>
  new Date(Date.UTC(2026, month, day, hour, 0, 0));

// patron round-robin para 4 equipos (indices 0..3) -> 3 jornadas, 6 partidos
const ROUND_ROBIN: [number, number][][] = [
  [
    [0, 1],
    [2, 3],
  ], // jornada 1
  [
    [0, 2],
    [3, 1],
  ], // jornada 2
  [
    [0, 3],
    [1, 2],
  ], // jornada 3
];

async function main() {
  console.log("Limpiando datos previos...");
  await prisma.phaseSubmission.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // --- Usuario admin ---
  // Solo se crea a Menta (admin). El resto de jugadores se registran solos
  // desde la pantalla de login ("Crear cuenta"). Cambia el PIN aquí si quieres.
  const adminPin = process.env.ADMIN_PIN ?? "0902";
  await prisma.user.create({
    data: { name: "Menta", pinHash: bcrypt.hashSync(adminPin, 10), isAdmin: true },
  });
  console.log(`Usuario admin creado: Menta (PIN ${adminPin})`);

  // --- Equipos ---
  const groupLetters = Object.keys(GROUPS);
  const teamIdByGroup: Record<string, number[]> = {};
  for (const g of groupLetters) {
    teamIdByGroup[g] = [];
    for (const t of GROUPS[g]) {
      const team = await prisma.team.create({
        data: { name: t.name, code: t.code, flag: t.flag, iso: t.iso, groupName: g },
      });
      teamIdByGroup[g].push(team.id);
    }
  }
  console.log(`Equipos creados: ${groupLetters.length * 4}`);

  // --- Partidos de fase de grupos (72) ---
  // Jornada 1: 11-16 jun, Jornada 2: 17-22 jun, Jornada 3: 23-27 jun.
  // 12 grupos repartidos de a 2 por dia -> offset = floor(indiceGrupo / 2)
  let matchNo = 0;
  for (let gi = 0; gi < groupLetters.length; gi++) {
    const g = groupLetters[gi];
    const ids = teamIdByGroup[g];
    const dayOffset = Math.floor(gi / 2);
    const baseDays = [11, 17, 23]; // dia base de cada jornada
    const hours = [16, 19]; // dos partidos por jornada
    for (let jornada = 0; jornada < 3; jornada++) {
      const pairs = ROUND_ROBIN[jornada];
      for (let p = 0; p < pairs.length; p++) {
        matchNo++;
        const [hi, ai] = pairs[p];
        await prisma.match.create({
          data: {
            matchNo,
            phase: "GROUP",
            groupName: g,
            kickoff: dt(baseDays[jornada] + dayOffset, hours[p]),
            homeTeamId: ids[hi],
            awayTeamId: ids[ai],
          },
        });
      }
    }
  }
  console.log(`Partidos de grupos creados: ${matchNo}`);

  // --- Partidos eliminatorios (slots vacios 73..104) ---
  // Los equipos de 16avos se asignan desde /admin al cerrar la fase de grupos;
  // de 8vos en adelante avanzan solos (cuadro oficial en src/lib/bracket.ts).
  const phaseOf = (no: number) =>
    no <= 88 ? "R32" : no <= 96 ? "R16" : no <= 100 ? "QF" : no <= 102 ? "SF" : no === 103 ? "THIRD" : "FINAL";
  const kickoffOf = (no: number) => {
    if (no <= 88) return dt(28 + Math.floor((no - 73) / 3), 16); // 28 jun - 3 jul
    if (no <= 96) return dt(4 + Math.floor((no - 89) / 2), 16, 6); // 4-7 jul
    if (no <= 100) return dt(9 + Math.floor((no - 97) / 2), 16, 6); // 9-10 jul
    if (no <= 102) return dt(14 + (no - 101), 16, 6); // 14-15 jul (semis)
    if (no === 103) return dt(18, 16, 6); // tercer lugar
    return dt(19, 16, 6); // final
  };

  let koCount = 0;
  for (let no = 73; no <= 104; no++) {
    await prisma.match.create({
      data: {
        matchNo: no,
        phase: phaseOf(no),
        slotLabel: knockoutLabel(no),
        kickoff: kickoffOf(no),
      },
    });
    koCount++;
  }
  console.log(`Partidos eliminatorios creados: ${koCount}`);
  console.log("Seed completo ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
