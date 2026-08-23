import type { MetadataRoute } from "next";
import { BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "./lib/site";

/**
 * Se sirve en /manifest.webmanifest. Es lo que hace que el juego se pueda
 * "Agregar a pantalla de inicio" en Android/iOS y se abra a pantalla
 * completa, sin barra de direcciones.
 *
 * Los iconos son PNG generados al vuelo (ver app/pwa-icon/[size]/route.tsx):
 * así no hay binarios en el repo y el día que cambie la paleta, cambian
 * solos.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "es",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND.feltDeep,
    theme_color: BRAND.felt,
    categories: ["games", "education", "entertainment"],
    icons: [
      {
        src: "/pwa-icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // "maskable" = Android puede recortarlo con la forma que use el
        // lanzador sin comerse el dibujo (el icono deja margen de sobra).
        src: "/pwa-icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Jugar una partida",
        short_name: "Jugar",
        url: "/play",
      },
      {
        name: "Mis partidas",
        short_name: "Historial",
        url: "/history",
      },
    ],
  };
}
