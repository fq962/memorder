/**
 * Tarjeta social de la home (`/`). También es la que heredan las rutas que
 * no definen la suya.
 */
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "./lib/og";
import { SITE_NAME } from "./lib/site";

export const alt = `${SITE_NAME} — juego arcade de memoria: memoriza el orden de las palabras y reconstrúyelo`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    eyebrow: "JUEGO DE MEMORIA",
    subtitle: "Memoriza el orden. Un solo error y game over.",
    words: ["LAGO", "PERRO", "NUBE", "FUEGO"],
  });
}
