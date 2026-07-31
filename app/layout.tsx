import type { Metadata } from "next";
import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import SettingsMenu from "./components/SettingsMenu";
import PendingRunSync from "./components/PendingRunSync";
import { SettingsProvider } from "./lib/settings";
import { AuthProvider } from "./lib/auth";
import { ProfileProvider } from "./lib/profile";
import { getThemesData } from "./lib/themes-server";
import { toThemeOption } from "./lib/themes";
import "./globals.css";

// Fuente de titulares / números: pixel puro, estilo arcade.
const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

// Fuente de cuerpo: pixel legible para textos largos y palabras del juego.
const pixelSans = Pixelify_Sans({
  variable: "--font-pixel-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MEMORDER",
  description: "Memoriza el orden. Estilo arcade brainrot.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Temas "de base de datos" (todo lo que no sea original/hacker/cozy): se
  // traen una vez en el build (cache: "force-cache" en el fetch, ver
  // app/lib/themes-server.ts) y su CSS ya generado se inyecta acá abajo. Un
  // tema nuevo en la tabla `themes` + un redeploy alcanza para que aparezca,
  // sin tocar código.
  const { extraThemes, css } = await getThemesData();
  const extraThemeOptions = extraThemes.map(toThemeOption);

  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${pixelSans.variable} h-full antialiased`}
    >
      {/* overflow-x-clip y no -hidden: "hidden" convertiría el body en
          contenedor de scroll (y con él, en ancla de los posicionamientos de
          dentro). "clip" recorta el desborde igual sin crear scrollport. */}
      <body
        suppressHydrationWarning
        className="bg-felt text-cream relative flex min-h-full flex-col overflow-x-clip font-sans"
      >
        {/* CSS de los temas de base de datos: igual que los bloques de
            fábrica en globals.css, sin capa (@layer) para que gane siempre
            sobre las utilidades de Tailwind. Un <style> normal en cualquier
            parte del documento alcanza, no hace falta que viva en <head>. */}
        {css && <style id="db-themes" dangerouslySetInnerHTML={{ __html: css }} />}
        {/* Vignette + felt de fondo, detrás de todo. */}
        <div aria-hidden className="bg-felt-glow pointer-events-none fixed inset-0 -z-20" />
        {/* Scanlines CRT sutiles sobre toda la pantalla. */}
        <div aria-hidden className="scanlines pointer-events-none fixed inset-0 -z-10" />
        <SettingsProvider extraThemeOptions={extraThemeOptions}>
          <AuthProvider>
            <ProfileProvider>
              <SettingsMenu />
              <PendingRunSync />
              {children}
            </ProfileProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
