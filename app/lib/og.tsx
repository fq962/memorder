/**
 * Fábrica de las imágenes de Open Graph (las que se ven al pegar un link en
 * WhatsApp, X, Discord, Telegram, Slack, iMessage…).
 *
 * Todas las rutas con `opengraph-image.tsx` usan `renderOgImage()` para que
 * las tarjetas se vean como la misma familia: fieltro oscuro, título cromado
 * y una fila de cartas con palabras, igual que el juego.
 *
 * Ojo con Satori (el motor de `next/og`): solo entiende flexbox y un subset
 * de CSS. Nada de `display: grid`, y todo contenedor con más de un hijo
 * necesita `display: flex` explícito. Además solo hay una fuente cargada
 * (la pixel del juego), así que todo el texto sale en pixel art aunque se
 * pida otra familia: los tamaños de acá abajo están calculados para eso.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, SITE_URL } from "./site";

/** Medidas que piden Facebook/X para la tarjeta grande. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** El mismo arcoíris cromado del título del juego (ver globals.css). */
const CHROME_GRADIENT = `linear-gradient(100deg, ${BRAND.purple} 0%, #ffffff 12%, ${BRAND.red} 24%, ${BRAND.gold} 36%, #ffffff 48%, ${BRAND.green} 60%, ${BRAND.blue} 72%, ${BRAND.pink} 84%, #ffffff 94%, ${BRAND.purple} 100%)`;

/** Fieltro + brillos radiales, calcados del `--felt-glow` de globals.css. */
const FELT_BACKGROUND = [
  `radial-gradient(circle at 50% 12%, rgba(176, 107, 255, 0.30), transparent 55%)`,
  `radial-gradient(circle at 85% 85%, rgba(58, 160, 255, 0.20), transparent 50%)`,
  `radial-gradient(circle at 12% 88%, rgba(255, 77, 94, 0.20), transparent 50%)`,
  `linear-gradient(160deg, #14283a 0%, ${BRAND.felt} 55%, ${BRAND.feltDeep} 100%)`,
].join(", ");

/**
 * Carga la Press Start 2P (la misma fuente pixel del juego) para dársela a
 * Satori, que necesita sí o sí al menos una fuente para poder medir el
 * texto.
 *
 * Se lee del repo y no de Google Fonts a propósito: todas las imágenes de
 * este archivo se prerenderizan en el build, así que bajarla por red sería
 * meterle al build una dependencia externa que puede fallar. El archivo es
 * el woff del subset latin (~35 KB) — Satori entiende ttf, otf y woff, pero
 * NO woff2, que es lo que Google sirve a los navegadores modernos.
 *
 * Se cachea en memoria porque el build dibuja varias imágenes seguidas.
 */
let pixelFontCache: Buffer | null = null;

async function loadPixelFont(): Promise<Buffer> {
  if (!pixelFontCache) {
    pixelFontCache = await readFile(
      join(process.cwd(), "public", "fonts", "press-start-2p.woff"),
    );
  }
  return pixelFontCache;
}

/** Una "carta" de palabra, como las que se arrastran en la partida. */
function WordCard({
  word,
  index,
  accent,
}: {
  word: string;
  index: number;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderRadius: 16,
        background: "#fbf3dd",
        border: `4px solid ${accent}`,
        boxShadow: `0 10px 0 0 ${accent}`,
        transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)`,
      }}
    >
      <span style={{ fontSize: 20, color: accent }}>{index + 1}</span>
      <span style={{ fontSize: 26, color: "#1a1030", letterSpacing: 1 }}>
        {word}
      </span>
    </div>
  );
}

export type OgImageOptions = {
  /** Línea grande. Por defecto el nombre del juego. */
  title?: string;
  /** Línea chica de arriba (una etiqueta tipo "RANKING GLOBAL"). */
  eyebrow?: string;
  /** Frase debajo del título. */
  subtitle?: string;
  /** Las palabras de las cartas. Cuatro entran cómodas. */
  words?: string[];
};

/**
 * Dibuja la tarjeta social. Devuelve la `ImageResponse` lista para que la
 * exporte un `opengraph-image.tsx` / `twitter-image.tsx`.
 */
export async function renderOgImage({
  title = "MEMORDER",
  eyebrow = "JUEGO DE MEMORIA",
  subtitle = "Memoriza el orden. Un solo error y game over.",
  words = ["LAGO", "PERRO", "NUBE", "FUEGO"],
}: OgImageOptions = {}) {
  const accents = [BRAND.gold, BRAND.red, BRAND.purple, BRAND.blue];

  const pixelFont = await loadPixelFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND.felt,
          backgroundImage: FELT_BACKGROUND,
          fontFamily: "PressStart",
          padding: 64,
        }}
      >
        {/* Etiqueta de arriba, en una "ficha" del color de la casa. */}
        <div
          style={{
            display: "flex",
            padding: "10px 22px",
            borderRadius: 999,
            border: `3px solid ${BRAND.gold}`,
            color: BRAND.gold,
            fontSize: 20,
            letterSpacing: 2,
            marginBottom: 34,
          }}
        >
          {eyebrow}
        </div>

        {/* Título con el arcoíris cromado: gradiente recortado al texto. */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 12 ? 78 : 104,
            letterSpacing: 2,
            backgroundImage: CHROME_GRADIENT,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginBottom: 26,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 20,
            lineHeight: 1.7,
            maxWidth: 860,
            color: BRAND.cream,
            opacity: 0.85,
            textAlign: "center",
            marginBottom: 46,
          }}
        >
          {subtitle}
        </div>

        {/* Las cartas del juego, ligeramente inclinadas como en la mesa. */}
        <div style={{ display: "flex", gap: 20 }}>
          {words.slice(0, 4).map((word, i) => (
            <WordCard
              key={word}
              word={word}
              index={i}
              accent={accents[i % accents.length]}
            />
          ))}
        </div>

        {/* Pie con el dominio, para que la tarjeta se lea sola. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 38,
            fontSize: 16,
            color: BRAND.cream,
            opacity: 0.55,
          }}
        >
          {SITE_URL.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "PressStart", data: pixelFont, style: "normal", weight: 400 },
      ],
    },
  );
}

/**
 * Icono cuadrado de la app: el que ve Android en el lanzador, iOS en la
 * pantalla de inicio y el navegador en la pestaña.
 *
 * Es una "M" cromada sobre el fieltro, con un margen generoso para que los
 * lanzadores que recortan en círculo (los iconos `maskable`) no se coman
 * nada del dibujo.
 */
export async function renderIconImage(size: number) {
  const pixelFont = await loadPixelFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: BRAND.felt,
          backgroundImage: `radial-gradient(circle at 50% 32%, #1c3550 0%, ${BRAND.felt} 60%, ${BRAND.feltDeep} 100%)`,
          fontFamily: "PressStart",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: size * 0.44,
            backgroundImage: CHROME_GRADIENT,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          M
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [
        { name: "PressStart", data: pixelFont, style: "normal", weight: 400 },
      ],
    },
  );
}
