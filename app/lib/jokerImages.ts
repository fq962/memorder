import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { JokerId } from "./jokers";

/**
 * Las cartas de comodín, leídas del disco y devueltas como data URI para
 * poder incrustarlas en la tarjeta de resultado.
 *
 * Van en data URI y no como URL absoluta porque Satori tendría que salir a
 * buscarlas por red en mitad del render: más lento y una cosa más que puede
 * fallar. Que los archivos viajen en el bundle del servidor lo asegura
 * `outputFileTracingIncludes` en next.config.ts.
 *
 * Y van en PNG y no en el .webp que usa el juego porque Satori no sabe leer
 * webp: revienta con un "is not iterable" al intentar medir la imagen. Las
 * copias viven en public/cards/share/, reescaladas a 360px de alto (se
 * dibujan a 124x170, así que sobra) para no cargar el repo. Se regeneran
 * con:
 *
 *   sips -s format png -Z 360 public/cards/<id>.webp \
 *     --out public/cards/share/<id>.png
 *
 * Solo lo importa la ruta /share-card (servidor): usa fs, no funciona en el
 * navegador.
 *
 * Se cachean por id: la misma carta aparece en muchas partidas.
 */
const cache = new Map<JokerId, string>();

async function loadJokerImage(id: JokerId): Promise<string> {
  const cached = cache.get(id);
  if (cached) return cached;

  const file = join(process.cwd(), "public", "cards", "share", `${id}.png`);
  const bytes = await readFile(file);
  const dataUri = `data:image/png;base64,${bytes.toString("base64")}`;

  cache.set(id, dataUri);
  return dataUri;
}

/** Resuelve varias cartas a la vez, en el mismo orden en que se pidieron. */
export function loadJokerImages(ids: JokerId[]): Promise<string[]> {
  return Promise.all(ids.map(loadJokerImage));
}
