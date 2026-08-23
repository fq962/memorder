import type { Metadata } from "next";

/**
 * El historial es contenido privado: sin sesión no muestra nada, así que no
 * tiene sentido que un buscador lo indexe. Igual conserva título y
 * descripción para la pestaña del navegador y para los links compartidos.
 */

const title = "Mis partidas";
const description =
  "Tu historial de partidas en MEMORDER: puntaje, ronda alcanzada y comodines de cada run.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/history" },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: `${title} · MEMORDER`,
    description,
    url: "/history",
    type: "website",
  },
};

export default function HistoryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
