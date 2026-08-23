/**
 * Fábrica de imágenes generadas con `next/og`: las tarjetas sociales de cada
 * ruta (`opengraph-image.tsx`), los iconos de la PWA y la tarjeta de
 * resultado que se comparte al terminar una partida (`/share-card`).
 *
 * Todas comparten la misma cara — fieltro con brillos, título cromado,
 * cartas de parchment — porque todas salen de acá y todas se pintan con una
 * paleta `CoreColors`, la misma estructura de 10 colores que usa el motor de
 * temas (app/lib/theme-engine.ts). Por eso la tarjeta de resultado puede
 * salir con el tema que el jugador tenga puesto sin duplicar una sola
 * fórmula de color.
 *
 * Ojo con Satori (el motor de `next/og`): solo entiende flexbox y un subset
 * de CSS. Nada de `display: grid`, y todo contenedor con más de un hijo
 * necesita `display: flex` explícito. Además solo hay una fuente cargada (la
 * pixel del juego), así que todo el texto sale en pixel art aunque se pida
 * otra familia: los tamaños de acá abajo están calculados para eso.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { buildChromeGradient, type CoreColors } from "./theme-engine";
import { BRAND, SITE_URL } from "./site";

/** Medidas que piden Facebook/X para la tarjeta grande. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/**
 * La paleta del tema "original", la de globals.css. Es la que usan las
 * imágenes fijas (OG e iconos), que no dependen de ningún jugador.
 */
export const DEFAULT_PALETTE: CoreColors = {
  felt: BRAND.felt,
  cream: BRAND.cream,
  chipRed: BRAND.red,
  chipBlue: BRAND.blue,
  chipGold: BRAND.gold,
  chipGreen: BRAND.green,
  chipPurple: BRAND.purple,
  chipPink: BRAND.pink,
  cardFace: BRAND.cardFace,
  cardInk: BRAND.cardInk,
};

/** Convierte "#rrggbb" en "rgba(r, g, b, a)". */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Aclara (amount > 0) u oscurece (amount < 0) un hex, en puntos de 0-255. */
function shade(hex: string, amount: number): string {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount)));
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

/**
 * Fieltro + brillos radiales, la misma receta que `buildFeltGlow()` del
 * motor de temas. Se reescribe acá en vez de reusarla porque aquella emite
 * un `radial-gradient(ellipse at center, …)` pensado para el navegador, y
 * Satori solo digiere con seguridad los `circle at x% y%`.
 */
function feltBackground(p: CoreColors): string {
  return [
    `radial-gradient(circle at 50% 12%, ${withAlpha(p.chipPurple, 0.3)}, transparent 55%)`,
    `radial-gradient(circle at 85% 85%, ${withAlpha(p.chipBlue, 0.2)}, transparent 50%)`,
    `radial-gradient(circle at 12% 88%, ${withAlpha(p.chipRed, 0.2)}, transparent 50%)`,
    `linear-gradient(160deg, ${shade(p.felt, 18)} 0%, ${p.felt} 55%, ${shade(p.felt, -22)} 100%)`,
  ].join(", ");
}

/**
 * Carga la Press Start 2P (la misma fuente pixel del juego) para dársela a
 * Satori, que necesita sí o sí al menos una fuente para poder medir el
 * texto.
 *
 * Se lee del repo y no de Google Fonts a propósito: bajarla por red sería
 * meterle una dependencia externa tanto al build (que prerenderiza las OG)
 * como a la ruta de la tarjeta de resultado, que se dibuja a pedido. El
 * archivo es el woff del subset latin (~35 KB) — Satori entiende ttf, otf y
 * woff, pero NO woff2, que es lo que Google sirve a los navegadores
 * modernos.
 *
 * La ruta dinámica necesita además que el archivo viaje en el bundle del
 * servidor: eso lo asegura `outputFileTracingIncludes` en next.config.ts.
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

/** Envuelve la fuente en las opciones que espera ImageResponse. */
async function fontOptions() {
  return [
    {
      name: "PressStart",
      data: await loadPixelFont(),
      style: "normal" as const,
      weight: 400 as const,
    },
  ];
}

/**
 * Una "carta" de parchment con sombra dura, el ladrillo visual del juego:
 * lo usan tanto las palabras de las OG como los paneles de la tarjeta de
 * resultado.
 */
function Card({
  children,
  accent,
  palette,
  padding = "14px 20px",
  width,
  tilt = 0,
}: {
  children: React.ReactNode;
  accent: string;
  palette: CoreColors;
  padding?: string;
  width?: number;
  tilt?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding,
        borderRadius: 16,
        background: palette.cardFace,
        border: `4px solid ${accent}`,
        boxShadow: `0 10px 0 0 ${accent}`,
        // Satori se atraganta con las propiedades en `undefined` (revienta
        // con "is not iterable" al intentar parsearlas), así que las
        // opcionales se agregan solo cuando tienen valor.
        ...(width ? { width } : {}),
        ...(tilt ? { transform: `rotate(${tilt}deg)` } : {}),
      }}
    >
      {children}
    </div>
  );
}

export type OgImageOptions = {
  /** Línea grande. Por defecto el nombre del juego. */
  title?: string;
  /** Línea chica de arriba (una etiqueta tipo "RONDA 1"). */
  eyebrow?: string;
  /** Frase debajo del título. */
  subtitle?: string;
  /** Las palabras de las cartas. Cuatro entran cómodas. */
  words?: string[];
};

/** Tarjeta social apaisada (1200×630) para los `opengraph-image.tsx`. */
export async function renderOgImage({
  title = "MEMORDER",
  eyebrow = "JUEGO DE MEMORIA",
  subtitle = "Memoriza el orden. Un solo error y game over.",
  words = ["LAGO", "PERRO", "NUBE", "FUEGO"],
}: OgImageOptions = {}) {
  const p = DEFAULT_PALETTE;
  const accents = [p.chipGold, p.chipRed, p.chipPurple, p.chipBlue];

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
          backgroundColor: p.felt,
          backgroundImage: feltBackground(p),
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
            border: `3px solid ${p.chipGold}`,
            color: p.chipGold,
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
            backgroundImage: buildChromeGradient(p),
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
            color: p.cream,
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
            <Card
              key={word}
              accent={accents[i % accents.length]}
              palette={p}
              tilt={i % 2 === 0 ? -2 : 2}
            >
              <span style={{ fontSize: 20, color: accents[i % accents.length] }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 26, color: p.cardInk, letterSpacing: 1 }}>
                {word}
              </span>
            </Card>
          ))}
        </div>

        {/* Pie con el dominio, para que la tarjeta se lea sola. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 38,
            fontSize: 16,
            color: p.cream,
            opacity: 0.55,
          }}
        >
          {SITE_URL.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fontOptions() },
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
  const p = DEFAULT_PALETTE;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: p.felt,
          backgroundImage: `radial-gradient(circle at 50% 32%, ${shade(p.felt, 22)} 0%, ${p.felt} 60%, ${shade(p.felt, -22)} 100%)`,
          fontFamily: "PressStart",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: size * 0.44,
            backgroundImage: buildChromeGradient(p),
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          M
        </div>
      </div>
    ),
    { width: size, height: size, fonts: await fontOptions() },
  );
}

/** Medidas de la tarjeta de resultado: retrato, como pide un chat. */
export const SHARE_CARD_SIZE = { width: 1080, height: 1350 };

export type ShareCardOptions = {
  score: number;
  round: number;
  wordsCorrect: number;
  seed: string;
  /** Cartas de comodín ya resueltas a imagen: `src` en data URI + su halo. */
  jokers: { src: string; glow: string }[];
  /** Textos ya traducidos por quien llama (la ruta lee el idioma del query). */
  labels: {
    gameOver: string;
    score: string;
    round: string;
    words: string;
    seed: string;
    jokers: string;
    tagline: string;
  };
  palette: CoreColors;
};

/**
 * Tarjeta de resultado de una partida (1080×1350), la que se adjunta al
 * compartir desde el Game Over.
 *
 * Sale del mismo molde que las OG a propósito: quien recibe la imagen por
 * WhatsApp ve exactamente la misma marca que si hubiera abierto el link.
 */
export async function renderShareCard({
  score,
  round,
  wordsCorrect,
  seed,
  jokers,
  labels,
  palette: p,
}: ShareCardOptions) {
  const scoreText = String(score);
  // El puntaje no tiene largo fijo: se encoge para que 7 cifras entren igual.
  const scoreSize = Math.min(
    150,
    Math.floor(760 / Math.max(scoreText.length, 4)),
  );

  // Con muchas rondas se juntan más comodines de los que caben en una fila.
  const visibleJokers = jokers.slice(0, 5);
  const extraJokers = jokers.length - visibleJokers.length;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // El bloque va centrado y el pie posicionado abajo: así la tarjeta
          // se ve igual de compacta con comodines y sin ellos, en vez de
          // quedar un hueco en el medio cuando la partida no dio ninguno.
          justifyContent: "center",
          backgroundColor: p.felt,
          backgroundImage: feltBackground(p),
          fontFamily: "PressStart",
          padding: "72px 70px 190px",
        }}
      >
        {/* ---- Cabecera: ficha GAME OVER + título cromado ---- */}
        <div
          style={{
            display: "flex",
            padding: "12px 26px",
            borderRadius: 999,
            border: `3px solid ${p.chipRed}`,
            color: p.chipRed,
            fontSize: 22,
            letterSpacing: 2,
            marginBottom: 30,
          }}
        >
          {labels.gameOver}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            letterSpacing: 2,
            backgroundImage: buildChromeGradient(p),
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginBottom: 44,
          }}
        >
          MEMORDER
        </div>

        {/* ---- Panel del puntaje: la carta grande de la tarjeta ---- */}
        <Card accent={p.chipGold} palette={p} padding="40px 32px" width={940}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 3,
                color: withAlpha(p.cardInk, 0.6),
                marginBottom: 28,
              }}
            >
              {labels.score}
            </div>
            <div style={{ display: "flex", fontSize: scoreSize, color: p.chipRed }}>
              {scoreText}
            </div>
          </div>
        </Card>

        {/* ---- Ronda alcanzada y palabras acertadas ---- */}
        <div style={{ display: "flex", gap: 28, marginTop: 34 }}>
          {[
            { label: labels.round, value: round, accent: p.chipBlue },
            { label: labels.words, value: wordsCorrect, accent: p.chipGreen },
          ].map((chip) => (
            <Card
              key={chip.label}
              accent={chip.accent}
              palette={p}
              padding="26px 20px"
              width={456}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 17,
                    letterSpacing: 2,
                    color: withAlpha(p.cardInk, 0.6),
                    marginBottom: 16,
                  }}
                >
                  {chip.label}
                </div>
                <div style={{ display: "flex", fontSize: 62, color: p.cardInk }}>
                  {chip.value}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ---- Comodines conseguidos, con su halo por rareza ----
             Va como ternario y no como `&&`: un `false` suelto entre los
             hijos hace reventar a Satori. */}
        {visibleJokers.length === 0 ? null : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 46,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 17,
                letterSpacing: 2,
                color: withAlpha(p.cream, 0.55),
                marginBottom: 22,
              }}
            >
              {labels.jokers}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {visibleJokers.map((joker, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={joker.src}
                  alt=""
                  width={142}
                  height={195}
                  style={{
                    borderRadius: 10,
                    border: `3px solid ${joker.glow}`,
                    boxShadow: `0 0 26px 2px ${joker.glow}`,
                  }}
                />
              ))}
              {extraJokers === 0 ? null : (
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    color: withAlpha(p.cream, 0.7),
                  }}
                >
                  +{extraJokers}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Semilla: lo que permite rejugar exactamente esta partida ---- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 52,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 16,
              letterSpacing: 2,
              color: withAlpha(p.cream, 0.5),
              marginBottom: 16,
            }}
          >
            {labels.seed}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              letterSpacing: 6,
              color: p.chipPurple,
            }}
          >
            {seed}
          </div>
        </div>

        {/* ---- Pie: tagline + dominio ---- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            bottom: 72,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 16,
              color: withAlpha(p.cream, 0.6),
              marginBottom: 18,
            }}
          >
            {labels.tagline}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: p.chipGold }}>
            {SITE_URL.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    { ...SHARE_CARD_SIZE, fonts: await fontOptions() },
  );
}
