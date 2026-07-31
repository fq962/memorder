// Motor de temas: a partir de 10 colores "núcleo" (los que se eligen a mano,
// uno por uno, con un color picker) calcula TODO lo demás que un tema
// necesita para reskinear la app entera — el degradado cromado del título,
// el brillo radial de fondo y la escala de 20 tonos del ranking — con las
// mismas fórmulas que ya usaban a mano los 3 temas de fábrica (original,
// hacker, cozy; ver los bloques `:root[data-theme=...]` en globals.css).
//
// Así, crear un tema nuevo es fijar 10 colores, no 30+: los derivados salen
// solos y con la misma cara que los de fábrica. Lo usan tanto el fetch de
// build (app/lib/themes-server.ts) como la vista previa en vivo de
// /theme-lab, para que "lo que ves ahí" sea exactamente lo que se aplica.

/** Los 10 colores que definen la identidad visual de un tema. */
export type CoreColors = {
  felt: string;
  cream: string;
  chipRed: string;
  chipBlue: string;
  chipGold: string;
  chipGreen: string;
  chipPurple: string;
  chipPink: string;
  cardFace: string;
  cardInk: string;
};

/** Un tema completo: los 10 colores núcleo + su identidad (id/label). */
export type ThemeRecord = CoreColors & {
  /** Slug estable: es el valor de data-theme y la clave del selector CSS. */
  id: string;
  label: string;
  /** Orden en el selector de temas; menor va primero. */
  sortOrder?: number;
};

/** Nombres de los 10 campos núcleo, en el orden en que se piden en el editor. */
export const CORE_COLOR_FIELDS: { key: keyof CoreColors; label: string }[] = [
  { key: "felt", label: "Fondo (felt)" },
  { key: "cream", label: "Texto principal" },
  { key: "chipRed", label: "Chip rojo" },
  { key: "chipBlue", label: "Chip azul" },
  { key: "chipGold", label: "Chip dorado" },
  { key: "chipGreen", label: "Chip verde" },
  { key: "chipPurple", label: "Chip morado" },
  { key: "chipPink", label: "Chip rosa" },
  { key: "cardFace", label: "Cara de carta" },
  { key: "cardInk", label: "Tinta de carta" },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Interpola linealmente entre dos colores hex, t en [0, 1]. */
function mix(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Aclara (delta > 0) u oscurece (delta < 0) un color, en puntos de
 * luminosidad HSL. Se usa para sacar las dos paradas claras/oscuras del
 * brillo radial de fondo a partir de un solo color de fieltro.
 */
function adjustLightness(hex: string, deltaPercent: number): string {
  const [r0, g0, b0] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r0, g0, b0);
  const min = Math.min(r0, g0, b0);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r0) h = ((g0 - b0) / d) % 6;
    else if (max === g0) h = (b0 - r0) / d + 2;
    else h = (r0 - g0) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const newL = Math.max(0, Math.min(1, l + deltaPercent / 100));
  const c = (1 - Math.abs(2 * newL - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = newL - c / 2;
  let [r1, g1, b1] = [0, 0, 0];
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

/**
 * Escala de 20 tonos del ranking: un arco de color que va de dorado a azul
 * pasando por rojo, rosa y morado — los mismos 5 colores que ya definís
 * como chips, en el mismo orden en que los tres temas de fábrica lo hacían
 * a mano. 20 pasos repartidos en 4 tramos, interpolando color a color.
 */
export function buildAccentScale(colors: CoreColors): string[] {
  const stops = [
    colors.chipGold,
    colors.chipRed,
    colors.chipPink,
    colors.chipPurple,
    colors.chipBlue,
  ];
  const steps = 20;
  const segments = stops.length - 1;
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const scaled = (i / (steps - 1)) * segments;
    const segIndex = Math.min(segments - 1, Math.floor(scaled));
    const localT = scaled - segIndex;
    out.push(mix(stops[segIndex], stops[segIndex + 1], localT));
  }
  return out;
}

/** Degradado cromado del título/carta #1: misma receta que los 3 de fábrica. */
export function buildChromeGradient(colors: CoreColors): string {
  return (
    `linear-gradient(100deg, ${colors.chipPurple} 0%, #ffffff 10%, ` +
    `${colors.chipRed} 20%, ${colors.chipGold} 30%, #ffffff 42%, ` +
    `${colors.chipGreen} 52%, ${colors.chipBlue} 62%, ${colors.chipPink} 72%, ` +
    `#ffffff 84%, ${colors.chipPurple} 92%, ${colors.chipPurple} 100%)`
  );
}

/** Brillo radial + viñeta detrás del fieltro: 3 focos de color + el fondo. */
export function buildFeltGlow(colors: CoreColors): string {
  const light = adjustLightness(colors.felt, 6);
  const dark = adjustLightness(colors.felt, -5);
  return [
    `radial-gradient(circle at 50% 18%, ${withAlpha(colors.chipPurple, 0.22)}, transparent 55%)`,
    `radial-gradient(circle at 82% 82%, ${withAlpha(colors.chipBlue, 0.16)}, transparent 50%)`,
    `radial-gradient(circle at 12% 88%, ${withAlpha(colors.chipRed, 0.14)}, transparent 50%)`,
    `radial-gradient(ellipse at center, ${light} 0%, ${colors.felt} 55%, ${dark} 100%)`,
  ].join(",\n    ");
}

/** Bloque `:root[data-theme="id"] { ... }` completo para un tema. */
export function buildThemeCssBlock(theme: ThemeRecord): string {
  const accents = buildAccentScale(theme);
  const lines = [
    `--color-felt: ${theme.felt};`,
    `--color-cream: ${theme.cream};`,
    `--color-chip-red: ${theme.chipRed};`,
    `--color-chip-blue: ${theme.chipBlue};`,
    `--color-chip-gold: ${theme.chipGold};`,
    `--color-chip-green: ${theme.chipGreen};`,
    `--color-chip-purple: ${theme.chipPurple};`,
    `--color-chip-pink: ${theme.chipPink};`,
    `--color-card-face: ${theme.cardFace};`,
    `--color-card-ink: ${theme.cardInk};`,
    `--chrome-gradient: ${buildChromeGradient(theme)};`,
    ...accents.map((hex, i) => `--color-accent-${i + 1}: ${hex};`),
    `--felt-glow: ${buildFeltGlow(theme)};`,
  ];
  return `:root[data-theme="${theme.id}"] {\n  ${lines.join("\n  ")}\n}`;
}

/** Concatena los bloques CSS de una lista de temas, listo para inyectar. */
export function buildThemesCss(themes: ThemeRecord[]): string {
  return themes.map(buildThemeCssBlock).join("\n\n");
}
