// Reabre una fase para un usuario que "cerró la apuesta" sin alcanzar a anotar
// (o que necesita re-editar). Solo borra su candado en PhaseSubmission; NO toca
// predicciones ni datos de otros usuarios.
//
// Uso (PRODUCCIÓN) — primero en seco (muestra estado), luego confirmando:
//   DATABASE_URL="file:/var/www/polla-data/prod.db" USUARIO="ElFields" FASE="GROUP" npx tsx prisma/reabrir-fase.ts
//   DATABASE_URL="file:/var/www/polla-data/prod.db" USUARIO="ElFields" FASE="GROUP" CONFIRM=1 npx tsx prisma/reabrir-fase.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL;
const nombre = process.env.USUARIO;
const fase = process.env.FASE ?? "GROUP";

if (!url) {
  console.error('Falta DATABASE_URL. Ej: DATABASE_URL="file:/var/www/polla-data/prod.db"');
  process.exit(1);
}
if (!nombre) {
  console.error('Falta USUARIO. Ej: USUARIO="ElFields"');
  process.exit(1);
}

console.log("Base de datos:", url);
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main() {
  const user = await prisma.user.findUnique({ where: { name: nombre } });
  if (!user) {
    console.error(`No existe el usuario "${nombre}".`);
    process.exit(1);
  }

  const locks = await prisma.phaseSubmission.findMany({ where: { userId: user.id } });
  const preds = await prisma.prediction.count({ where: { userId: user.id } });
  const predsFase = await prisma.prediction.count({
    where: { userId: user.id, match: { phase: fase } },
  });

  console.log(`\nUsuario: ${user.name} (id ${user.id})`);
  console.log(`Fases cerradas: ${locks.map((l) => l.phase).join(", ") || "(ninguna)"}`);
  console.log(`Predicciones totales: ${preds}  ·  en fase ${fase}: ${predsFase}`);

  const lock = locks.find((l) => l.phase === fase);
  if (!lock) {
    console.log(`\nEl usuario NO tiene cerrada la fase ${fase}; no hay nada que reabrir.`);
    return;
  }

  if (process.env.CONFIRM !== "1") {
    console.log(
      `\n[SECO] Se borraría el candado de la fase ${fase} (PhaseSubmission id ${lock.id}).`
    );
    console.log("Vuelve a correr con CONFIRM=1 para aplicarlo.");
    return;
  }

  await prisma.phaseSubmission.delete({ where: { id: lock.id } });
  console.log(`\n✅ Fase ${fase} reabierta para ${user.name}. Ya puede volver a llenar y cerrar.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
