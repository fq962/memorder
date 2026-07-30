import type { Metadata } from "next";
import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import SettingsMenu from "./components/SettingsMenu";
import { SettingsProvider } from "./lib/settings";
import { AuthProvider } from "./lib/auth";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {/* Vignette + felt de fondo, detrás de todo. */}
        <div aria-hidden className="bg-felt-glow pointer-events-none fixed inset-0 -z-20" />
        {/* Scanlines CRT sutiles sobre toda la pantalla. */}
        <div aria-hidden className="scanlines pointer-events-none fixed inset-0 -z-10" />
        <SettingsProvider>
          <AuthProvider>
            <SettingsMenu />
            {children}
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
