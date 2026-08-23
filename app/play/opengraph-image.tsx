/** Tarjeta social propia de /play: la que se ve al compartir "vení a jugar". */
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../lib/og";

export const alt =
  "MEMORDER — empezá una partida: memorizá el orden de las palabras y reconstruilo";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOgImage({
    eyebrow: "RONDA 1",
    subtitle: "¿Cuántas rondas aguantás antes de fallar?",
    words: ["MESA", "VIENTO", "LLAVE", "SOMBRA"],
  });
}
