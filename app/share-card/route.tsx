/**
 * Tarjeta de resultado de una partida, en PNG: `/share-card?...`.
 *
 * La dibuja `renderShareCard()` (app/lib/og.tsx), el mismo módulo que hace
 * las imágenes de Open Graph, así que lo que se comparte por WhatsApp tiene
 * exactamente la misma cara que lo que se ve al pegar el link del juego.
 *
 * Es una ruta y no un dibujo en el cliente porque Satori resuelve tipografía,
 * degradados y sombras mucho mejor que el canvas a mano — y porque así hay
 * un solo lugar donde vive el diseño de todas las imágenes del juego.
 *
 * Todos los datos viajan en el query (ver app/lib/shareCard.ts, que arma la
 * URL): el servidor no consulta nada, solo dibuja lo que le pasan.
 */
import { JOKERS, type JokerId, type Rarity } from "../lib/jokers";
import { translations, type Language } from "../lib/i18n";
import { DEFAULT_PALETTE, renderShareCard } from "../lib/og";
import { loadJokerImages } from "../lib/jokerImages";
import type { CoreColors } from "../lib/theme-engine";

/**
 * Halo por rareza, mismo criterio que --holo-glow en globals.css.
 *
 * En hex y no en rgba() a propósito: Satori no sabe parsear un `border`
 * abreviado cuyo color lleva comas ("3px solid rgba(…)") y revienta con un
 * "is not iterable".
 */
const RARITY_GLOW: Record<Rarity, string> = {
  bronze: "#cd7f32",
  epic: "#b06bff",
  legendary: "#ffcb2b",
};

/**
 * Orden en el que viajan los colores dentro del parámetro `c`. Tiene que
 * coincidir con el de `packPalette()` en app/lib/shareCard.ts.
 */
const PALETTE_ORDER: (keyof CoreColors)[] = [
  "felt",
  "cream",
  "chipRed",
  "chipBlue",
  "chipGold",
  "chipGreen",
  "chipPurple",
  "chipPink",
  "cardFace",
  "cardInk",
];

/**
 * Desempaqueta "0e1a24-f6ecd4-…" en la paleta del tema que el jugador tenía
 * puesto. Cualquier cosa rara (largo distinto, hex inválido) cae al tema
 * original en vez de romper la imagen.
 */
function parsePalette(packed: string | null): CoreColors {
  if (!packed) return DEFAULT_PALETTE;

  const parts = packed.split("-");
  if (parts.length !== PALETTE_ORDER.length) return DEFAULT_PALETTE;
  if (!parts.every((hex) => /^[0-9a-fA-F]{6}$/.test(hex))) return DEFAULT_PALETTE;

  return Object.fromEntries(
    PALETTE_ORDER.map((key, i) => [key, `#${parts[i]}`]),
  ) as CoreColors;
}

/** Entero no negativo y acotado: el query lo escribe el cliente, no confiamos. */
function parseCount(value: string | null, max: number): number {
  const n = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const lang: Language = params.get("lang") === "en" ? "en" : "es";
  const t = translations[lang];

  const jokerIds = (params.get("jokers") ?? "")
    .split(",")
    .filter((id): id is JokerId => id in JOKERS);

  const jokerImages = await loadJokerImages(jokerIds);

  const seed = (params.get("seed") ?? "").slice(0, 24).toUpperCase();

  const image = await renderShareCard({
    score: parseCount(params.get("score"), 9_999_999),
    round: parseCount(params.get("round"), 999),
    wordsCorrect: parseCount(params.get("words"), 9_999),
    seed,
    jokers: jokerIds.map((id, i) => ({
      src: jokerImages[i],
      glow: RARITY_GLOW[JOKERS[id].rarity],
    })),
    labels: {
      gameOver: "GAME OVER",
      score: t["play.gameoverScore"].toUpperCase(),
      round: t["play.gameoverRoundReached"].toUpperCase(),
      words: t["play.gameoverWordsCorrect"].toUpperCase(),
      seed: t["play.gameoverSeed"].toUpperCase(),
      jokers: t["share.jokersLabel"],
      tagline: t["home.tagline"],
    },
    palette: parsePalette(params.get("c")),
  });

  // La imagen depende solo del query, así que se puede cachear fuerte: si
  // dos personas comparten la misma partida, la segunda no la vuelve a
  // dibujar.
  image.headers.set(
    "Cache-Control",
    "public, max-age=31536000, s-maxage=31536000, immutable",
  );
  return image;
}
