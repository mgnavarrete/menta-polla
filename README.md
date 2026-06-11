# 🏆 Menta Polla — Mundial 2026

App web para competir con tus predicciones del Mundial 2026.
Predices marcadores fase por fase — **Grupos → 16avos → 8vos → 4tos → Semis →
Final** — se calculan puntos automáticamente y compiten en la tabla. Pensada
para usarse desde el celular (diseño responsive).

Stack: **Next.js 16** (App Router) · **Prisma 7 + SQLite** · **Tailwind 4**.
Todo corre en un solo proceso, sin servidor de base de datos aparte. Las
banderas son SVG locales en `public/flags/` (de flagcdn.com).

> **Marca configurable:** el nombre que precede a “Polla” (título de la pestaña,
> login y cabecera) se controla con la variable `BRAND` del `.env`. Pon `Menta`,
> `Flenta`, `Oddi` o lo que quieras y reinicia el servidor. Por defecto: `Menta`.

---

## Cómo correr localmente

```bash
npm install
npx prisma migrate deploy   # crea la base de datos (dev.db)
npm run seed                # carga 48 equipos, 104 partidos y el admin Menta
npm run dev                 # corre en 0.0.0.0:3000
```

El server queda escuchando en `0.0.0.0`, así que también lo abres **desde el
celular** en la misma red WiFi: `http://TU-IP-LOCAL:3000` (ej.
`http://192.168.1.5:3000`). Para ver tu IP: `hostname -I` (Linux/WSL) o
`ipconfig` (Windows).

**Usuario inicial** (el PIN se toma de `ADMIN_PIN`, por defecto `0902`):

| Usuario | Rol                                 |
| ------- | ----------------------------------- |
| `Menta` | admin (carga los resultados reales) |

El seed crea **solo a Menta** (admin). El resto de jugadores **crean su cuenta**
desde la pantalla de inicio (botón “Crear cuenta”): solo pide nombre de usuario
y PIN. Se unen como jugadores.

Para empezar de cero en cualquier momento:

```bash
npm run db:reset && npm run seed
```

---

## Cómo se juega

- **Fase de grupos** (`/grupos`): pulsa **Editar fase**, anota el marcador de
  cada partido y pulsa **Guardar fase**. Ojo: una vez guardada, la fase queda
  bloqueada y **no se puede volver a editar**. La predicción del rival se
  revela recién al pitazo inicial de cada partido.
- **Eliminatorias** (`/eliminatorias/...`): igual, con botón Editar/Guardar por
  ronda. Cada ronda se habilita cuando termina la anterior. Además del
  marcador, eliges **quién avanza**.
- **Inicio** (`/`): tus apuestas en orden de juego (6 primeras) y “Ver todos los
  partidos” para verlos todos por fase.
- **Ranking** (`/ranking`): tabla de posiciones y desglose por partido.

### Puntaje (ajustable en `src/lib/scoring.ts`)

No acumulativo por marcador: cada partido da **solo el mayor** de los dos
(o el exacto, o solo el ganador).

| Concepto                                    | Puntos |
| ------------------------------------------- | ------ |
| Marcador exacto                             | 5      |
| Solo quién gana o empata (sin el exacto)    | 2      |
| Eliminatorias: acertar quién avanza (extra) | +2     |

### Rol admin (`/admin`)

1. Durante los grupos, carga el marcador real de cada partido. Al guardar se
   recalculan los puntos al instante.
2. Cuando terminan los grupos, en la sección **16avos** asigna los 32 equipos
   clasificados a cada llave (los dropdowns listan todos los equipos por grupo).
3. Carga los resultados de eliminatorias; los ganadores **se propagan solos** a
   la ronda siguiente. En empates de eliminatoria eliges quién gana por penales.

> Nota: las fechas/horas de los partidos son aproximadas según el calendario
> oficial; cualquier dato puede ajustarse editando `prisma/seed.ts` y
> re-sembrando, o directamente en la base de datos.

---

## Deploy en tu servidor

El proyecto está configurado con `output: "standalone"`, así que el build
genera un servidor autocontenido.

```bash
# 1) clona y entra
git clone git@github.com:mgnavarrete/menta-polla.git
cd menta-polla

# 2) variables de entorno: copia la plantilla y edítala
cp .env.example .env
#   - DATABASE_URL  -> ruta persistente, ej: file:/var/lib/polla/prod.db
#   - BRAND         -> Menta | Flenta | Oddi ...
#   - AUTH_SECRET   -> openssl rand -base64 32
#   - ADMIN_PIN     -> el PIN de Menta

# 3) instala, prepara la base y compila
npm ci
npx prisma migrate deploy        # crea/actualiza la base
npm run seed                     # SOLO la primera vez (crea al admin Menta)
npm run build

# 4) el build standalone NO copia los estáticos: hay que ponerlos junto al server
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 5) arrancar (lee el .env del directorio del proyecto)
NODE_ENV=production node .next/standalone/server.js   # escucha en PORT (default 3000)
```

Detrás de tu dominio, apunta el proxy (Nginx/Caddy) al puerto del proceso.

> ⚠️ **Persistencia:** la base SQLite (`DATABASE_URL`) debe vivir en una ruta que
> **no se borre en cada deploy** (ej. `/var/lib/polla/prod.db`), o perderás todas
> las predicciones. Corre `npm run seed` **una sola vez**: vuelve a crear la base
> desde cero y borra lo que haya.
>
> ⚠️ Define `AUTH_SECRET` en producción — sin él se usa un secreto por defecto
> inseguro para firmar las sesiones.
