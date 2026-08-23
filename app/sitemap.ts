import type { MetadataRoute } from "next";
import { absoluteUrl } from "./lib/site";

/**
 * Se sirve en /sitemap.xml.
 *
 * Solo las rutas públicas y estables. `/history` y `/profile/[userId]`
 * quedan fuera: piden sesión o son contenido por usuario, no hay nada que
 * un buscador pueda indexar de forma útil.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/play"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
