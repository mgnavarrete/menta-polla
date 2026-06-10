import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Backdrop from "@/components/Backdrop";
import { getSession } from "@/lib/auth";
import { BRAND, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/brand";

// Función (no constante) para que el título refleje BRAND en tiempo de
// ejecución del servidor, sin necesidad de reconstruir.
export function generateMetadata(): Metadata {
  return { title: SITE_TITLE, description: SITE_DESCRIPTION };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Backdrop />
        {session && (
          <Nav name={session.name} isAdmin={session.isAdmin} brand={BRAND} />
        )}
        <main className="mx-auto w-full max-w-5xl px-3 sm:px-4 py-5 sm:py-6 flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
