import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido para desplegar fácil en tu servidor (node server.js)
  output: "standalone",
  // Paquetes nativos que no deben empaquetarse por el bundler del servidor
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
};

export default nextConfig;
