import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "./lib/site";

/**
 * Se sirve en /robots.txt.
 *
 * Se bloquea lo que no aporta nada en un buscador: el Theme Lab (herramienta
 * interna de devs), los perfiles ajenos (URLs con UUID, contenido que cambia
 * todo el tiempo), la ruta que dibuja las tarjetas de resultado (una imagen
 * distinta por partida, infinitas URLs) y las rutas internas de Next.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/theme-lab",
          "/profile/",
          "/share-card",
          "/api/",
          "/_next/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    // `host` solo lo lee Yandex; va sin barra final.
    host: SITE_URL,
  };
}
