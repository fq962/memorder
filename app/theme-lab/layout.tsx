import type { Metadata } from "next";

/**
 * Theme Lab es la herramienta interna para armar temas. Fuera del índice de
 * cualquier buscador: no es contenido para jugadores.
 */
export const metadata: Metadata = {
  title: "Theme Lab",
  description: "Editor interno de temas de MEMORDER.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function ThemeLabLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
