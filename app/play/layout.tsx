import type { Metadata } from "next";

/**
 * La partida vive en un componente cliente (`page.tsx` con "use client"), y
 * `metadata` solo se puede exportar desde Server Components. Por eso cada
 * ruta del juego tiene este layout mínimo: no dibuja nada, solo aporta sus
 * metadatos.
 */

const title = "Jugar";
const description =
  "Empezá una partida de MEMORDER: memorizá el orden de las palabras, reconstruilo arrastrándolas y jugate los comodines. Un solo error y game over.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/play" },
  openGraph: {
    title: `${title} · MEMORDER`,
    description,
    url: "/play",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · MEMORDER`,
    description,
  },
};

export default function PlayLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
