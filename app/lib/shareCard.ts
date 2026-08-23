// Lado cliente de la tarjeta de resultado.
//
// El dibujo vive en el servidor (app/share-card/route.tsx, que llama a
// renderShareCard de app/lib/og.tsx): así la imagen que se comparte sale del
// mismo molde que las de Open Graph, en vez de ser un canvas dibujado a mano
// que había que mantener en paralelo.
//
// Lo único que queda acá es armar la URL con los datos de la partida — y,
// sobre todo, leer la paleta del tema que el jugador tiene puesto en ese
// momento para mandarla también. Sin eso, quien juega con el tema Spider-Man
// compartiría una tarjeta con los colores del tema original.
import type { JokerId } from "./jokers";
import type { Language } from "./i18n";
import type { CoreColors } from "./theme-engine";

/**
 * Orden en el que viajan los colores dentro del parámetro `c`. Tiene que
 * coincidir con el PALETTE_ORDER de app/share-card/route.tsx.
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

/** La variable CSS de globals.css que define cada color núcleo. */
const CSS_VARIABLE: Record<keyof CoreColors, string> = {
  felt: "--color-felt",
  cream: "--color-cream",
  chipRed: "--color-chip-red",
  chipBlue: "--color-chip-blue",
  chipGold: "--color-chip-gold",
  chipGreen: "--color-chip-green",
  chipPurple: "--color-chip-purple",
  chipPink: "--color-chip-pink",
  cardFace: "--color-card-face",
  cardInk: "--color-card-ink",
};

/** Deja "#0E1A24" / "#0e1a24 " en "0e1a24", o null si no es un hex de 6. */
function normalizeHex(value: string): string | null {
  const clean = value.trim().replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(clean) ? clean : null;
}

/**
 * Empaqueta el tema activo en un solo parámetro: "0e1a24-f6ecd4-…".
 *
 * Lee los valores computados de `<html>` en vez de tener una tabla de temas
 * en el cliente: funciona igual con los tres temas de fábrica, con los que
 * vienen de la base de datos y con los que se inventen mañana, sin tocar
 * este archivo. Si algún color no se puede leer, devuelve null y el servidor
 * dibuja con la paleta original.
 */
function packPalette(): string | null {
  if (typeof window === "undefined") return null;

  const styles = getComputedStyle(document.documentElement);
  const parts: string[] = [];

  for (const key of PALETTE_ORDER) {
    const hex = normalizeHex(styles.getPropertyValue(CSS_VARIABLE[key]));
    if (!hex) return null;
    parts.push(hex);
  }

  return parts.join("-");
}

export type ShareCardParams = {
  score: number;
  round: number;
  wordsCorrect: number;
  seed: string;
  jokers: JokerId[];
  language: Language;
};

/**
 * URL de la tarjeta de resultado de esta partida. Relativa a propósito: sirve
 * igual en local, en un preview y en producción.
 */
export function buildShareCardUrl({
  score,
  round,
  wordsCorrect,
  seed,
  jokers,
  language,
}: ShareCardParams): string {
  const params = new URLSearchParams({
    score: String(score),
    round: String(round),
    words: String(wordsCorrect),
    seed,
    lang: language,
  });

  if (jokers.length > 0) params.set("jokers", jokers.join(","));

  const palette = packPalette();
  if (palette) params.set("c", palette);

  return `/share-card?${params.toString()}`;
}
