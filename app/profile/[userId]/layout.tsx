import type { Metadata } from "next";

/**
 * Perfil público de un jugador.
 *
 * `index: false` a propósito: la URL lleva el UUID del usuario, el contenido
 * cambia en cada partida y no aporta nada al buscador. Lo que sí importa es
 * que el link se vea bien cuando alguien lo pega en WhatsApp, así que los
 * metadatos sociales quedan completos.
 */

const description =
  "Mirá las partidas, el mejor puntaje y los comodines de este jugador en MEMORDER.";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const title = "Perfil de jugador";

  return {
    title,
    description,
    alternates: { canonical: `/profile/${userId}` },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: `${title} · MEMORDER`,
      description,
      url: `/profile/${userId}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · MEMORDER`,
      description,
    },
  };
}

export default function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
