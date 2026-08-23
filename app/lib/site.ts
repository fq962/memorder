/**
 * Datos "de marca" del sitio, en un solo lugar.
 *
 * Todo el SEO (metadatos del layout, OG images, sitemap, robots, manifest y
 * el JSON-LD) sale de acá: si mañana cambia el dominio o la descripción, se
 * toca este archivo y nada más.
 *
 * El dominio se puede sobreescribir con NEXT_PUBLIC_SITE_URL (útil para
 * previews de Vercel o para un dominio propio) sin recompilar nada más.
 */

const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://memorder.vercel.app";

/** Sin barra final: todas las URLs se arman como `${SITE_URL}/loquesea`. */
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, "");

export const SITE_NAME = "MEMORDER";

/** Título de la home / fallback de las rutas hijas. */
export const SITE_TITLE = "MEMORDER — Juego de memoria: memoriza el orden";

/**
 * ~155 caracteres: es lo que Google suele mostrar antes de cortar el snippet.
 * También se reusa como og:description y twitter:description.
 */
export const SITE_DESCRIPTION =
  "Memoriza el orden de las palabras y reconstrúyelo. Un solo error y game over. Juego arcade de memoria gratis, sin instalar, con comodines y ranking global.";

/** Versión corta para el manifest y las tarjetas sociales. */
export const SITE_TAGLINE = "memoriza · o llora";

/** Idioma principal del contenido (el `lang` del <html>). */
export const SITE_LOCALE = "es_ES";

/** Los otros idiomas de la interfaz, para og:locale:alternate. */
export const SITE_LOCALE_ALTERNATES = ["en_US"];

/**
 * Keywords. Google las ignora desde hace años, pero varios buscadores
 * menores y agregadores de juegos (y algún scraper de IA) todavía las leen,
 * así que no cuesta nada dejarlas.
 */
export const SITE_KEYWORDS = [
  "juego de memoria",
  "memory game",
  "juego de palabras",
  "memorizar el orden",
  "entrenar la memoria",
  "memoria a corto plazo",
  "juego arcade",
  "juego online gratis",
  "juego sin descargar",
  "brain training",
  "juego de secuencias",
  "ranking global",
  "memorder",
];

export const CREATORS = [
  { name: "Fernando Quintanilla", url: "https://github.com/fq962" },
  { name: "Keneth Cubas", url: "https://github.com/kometha" },
  { name: "Milton Barrientos", url: "https://github.com/crywhat7" },
];

export const REPO_URL = "https://github.com/fq962/memorder";

/**
 * Colores de marca reusados por el manifest, el theme-color y las imágenes
 * generadas. Son los del tema "original" de globals.css.
 */
export const BRAND = {
  felt: "#0e1a24",
  feltDeep: "#070d13",
  cream: "#f6ecd4",
  gold: "#ffcb2b",
  red: "#ff4d5e",
  blue: "#3aa0ff",
  green: "#3ddc84",
  purple: "#b06bff",
  pink: "#ff5fc8",
  cardFace: "#fbf3dd",
  cardInk: "#1a1030",
} as const;

/** Helper para armar URLs absolutas (og:url, canonical, sitemap…). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
