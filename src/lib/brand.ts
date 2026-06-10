import "server-only";

// Marca configurable por entorno. Cambia el nombre que precede a "Polla"
// (ej. "Menta", "Flenta", "Oddi") definiendo BRAND en el .env del servidor.
// Se lee en el servidor en tiempo de ejecución: basta editar .env y reiniciar.
export const BRAND = (process.env.BRAND ?? "").trim() || "Menta";

// Título de la pestaña / metadata.
export const SITE_TITLE = `${BRAND} Polla — Mundial 2026`;
export const SITE_DESCRIPTION =
  "Predicciones del Mundial 2026 · arma tu polla y compite";
