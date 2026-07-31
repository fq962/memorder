// Tarjeta de resultado para compartir (WhatsApp y similares): se dibuja a
// mano en un <canvas>, sin dependencias nuevas, leyendo los mismos colores,
// tipografía y cartas de comodín que ya usa el resto del juego para que
// salga con la cara real de la app, no una genérica.
import { CARD_ASPECT, JOKERS, type JokerId, type Rarity } from "./jokers";
import type { TranslationKey } from "./i18n";

/** Retrato: se ve bien como imagen adjunta en un chat de WhatsApp. */
const WIDTH = 1080;
const HEIGHT = 1350;

export type ShareCardData = {
  score: number;
  round: number;
  wordsCorrect: number;
  seed: string;
  jokers: JokerId[];
  siteUrl: string;
  t: (key: TranslationKey) => string;
};

type Theme = {
  felt: string;
  cardFace: string;
  cardInk: string;
  gold: string;
  red: string;
  blue: string;
  green: string;
  purple: string;
};

const FALLBACK_THEME: Theme = {
  felt: "#0e1a24",
  cardFace: "#fbf3dd",
  cardInk: "#1a1030",
  gold: "#ffcb2b",
  red: "#ff4d5e",
  blue: "#3aa0ff",
  green: "#3ddc84",
  purple: "#b06bff",
};

/** Brillo por rareza, mismo criterio que --holo-glow en globals.css. */
const RARITY_GLOW: Record<Rarity, string> = {
  bronze: "rgba(205, 127, 50, 0.95)",
  epic: "rgba(176, 107, 255, 0.95)",
  legendary: "rgba(255, 203, 43, 0.95)",
};

/**
 * Lee los colores del tema activo (atributo data-theme en <html>, ver
 * app/globals.css) en vez de hardcodear el default: la tarjeta sale con la
 * misma paleta que el jugador tiene puesta.
 */
function readTheme(): Theme {
  if (typeof window === "undefined") return FALLBACK_THEME;
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;

  return {
    felt: read("--color-felt", FALLBACK_THEME.felt),
    cardFace: read("--color-card-face", FALLBACK_THEME.cardFace),
    cardInk: read("--color-card-ink", FALLBACK_THEME.cardInk),
    gold: read("--color-chip-gold", FALLBACK_THEME.gold),
    red: read("--color-chip-red", FALLBACK_THEME.red),
    blue: read("--color-chip-blue", FALLBACK_THEME.blue),
    green: read("--color-chip-green", FALLBACK_THEME.green),
    purple: read("--color-chip-purple", FALLBACK_THEME.purple),
  };
}

/** Lee el font-family real que aplica una clase (font-display / font-sans). */
function resolveFont(className: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.className = className;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const family = getComputedStyle(probe).fontFamily || fallback;
  probe.remove();
  return family;
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Aclara (percent > 0) u oscurece (percent < 0) un color hex. */
function shade(hex: string, percent: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const amt = (percent / 100) * 255;
  const r = clampByte(((num >> 16) & 0xff) + amt);
  const g = clampByte(((num >> 8) & 0xff) + amt);
  const b = clampByte((num & 0xff) + amt);
  return `rgb(${r}, ${g}, ${b})`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Espaciado manual entre caracteres: canvas no soporta letter-spacing. */
function tracked(text: string, gap = " "): string {
  return text.split("").join(gap);
}

/**
 * Dibuja la tarjeta de resultado en el canvas dado, lista para exportar con
 * canvas.toBlob(). Pensada para compartir: retrato, texto grande y legible
 * incluso a tamaño de miniatura de chat.
 */
export async function drawShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
): Promise<void> {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const theme = readTheme();
  const displayFont = resolveFont("font-display", '"Press Start 2P", monospace');
  const bodyFont = resolveFont("font-sans", "sans-serif");

  const [jokerImages] = await Promise.all([
    Promise.all(data.jokers.map((id) => loadImage(JOKERS[id].image))),
    document.fonts.ready,
  ]);

  // Fondo: gradiente vertical a partir del felt del tema activo.
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, shade(theme.felt, 14));
  bg.addColorStop(1, shade(theme.felt, -30));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Viñeta suave.
  const vignette = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT * 0.42,
    120,
    WIDTH / 2,
    HEIGHT * 0.5,
    WIDTH * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = "center";

  // Título.
  ctx.fillStyle = theme.gold;
  ctx.font = `70px ${displayFont}`;
  ctx.fillText("MEMORDER", WIDTH / 2, 160);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `24px ${bodyFont}`;
  ctx.fillText(tracked("GAME OVER"), WIDTH / 2, 205);

  // Tarjeta de puntaje.
  const scoreBox = { x: 90, y: 260, w: WIDTH - 180, h: 320, r: 32 };
  ctx.fillStyle = theme.cardFace;
  roundedRect(ctx, scoreBox.x, scoreBox.y, scoreBox.w, scoreBox.h, scoreBox.r);
  ctx.fill();

  ctx.fillStyle = `${theme.cardInk}99`;
  ctx.font = `26px ${bodyFont}`;
  ctx.fillText(
    tracked(data.t("play.gameoverScore").toUpperCase()),
    WIDTH / 2,
    scoreBox.y + 65,
  );

  ctx.fillStyle = theme.red;
  ctx.font = `170px ${displayFont}`;
  ctx.fillText(String(data.score), WIDTH / 2, scoreBox.y + 230);

  // Chips de ronda alcanzada y palabras acertadas.
  const chipY = scoreBox.y + scoreBox.h + 60;
  const chipH = 130;
  const chipW = (scoreBox.w - 30) / 2;
  const chips: Array<{
    x: number;
    color: string;
    label: string;
    value: string | number;
  }> = [
    {
      x: scoreBox.x,
      color: theme.blue,
      label: data.t("play.gameoverRoundReached"),
      value: data.round,
    },
    {
      x: scoreBox.x + chipW + 30,
      color: theme.green,
      label: data.t("play.gameoverWordsCorrect"),
      value: data.wordsCorrect,
    },
  ];
  for (const chip of chips) {
    ctx.fillStyle = chip.color;
    roundedRect(ctx, chip.x, chipY, chipW, chipH, 24);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = `20px ${bodyFont}`;
    ctx.fillText(chip.label.toUpperCase(), chip.x + chipW / 2, chipY + 45);
    ctx.fillStyle = "#12121a";
    ctx.font = `56px ${displayFont}`;
    ctx.fillText(String(chip.value), chip.x + chipW / 2, chipY + 105);
  }

  // Semilla.
  const seedY = chipY + chipH + 55;
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `20px ${bodyFont}`;
  ctx.fillText(
    tracked(data.t("play.gameoverSeed").toUpperCase()),
    WIDTH / 2,
    seedY,
  );
  ctx.fillStyle = theme.purple;
  ctx.font = `42px ${displayFont}`;
  ctx.fillText(tracked(data.seed, "  "), WIDTH / 2, seedY + 55);

  // Comodines conseguidos.
  const visible = jokerImages
    .map((img, i) => ({ img, id: data.jokers[i] }))
    .filter((entry): entry is { img: HTMLImageElement; id: JokerId } => !!entry.img);

  if (visible.length > 0) {
    const jokerY = seedY + 110;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `22px ${bodyFont}`;
    ctx.fillText(tracked(data.t("share.jokersLabel")), WIDTH / 2, jokerY);

    const cardW = 130;
    const cardH = Math.round(cardW / CARD_ASPECT);
    const gap = 24;
    const totalW = visible.length * cardW + (visible.length - 1) * gap;
    let x = WIDTH / 2 - totalW / 2;
    const y = jokerY + 30;

    for (const { img, id } of visible) {
      const glow = RARITY_GLOW[JOKERS[id].rarity];
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 26;
      roundedRect(ctx, x, y, cardW, cardH, 10);
      ctx.clip();
      ctx.drawImage(img, x, y, cardW, cardH);
      ctx.restore();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 4;
      roundedRect(ctx, x, y, cardW, cardH, 10);
      ctx.stroke();
      x += cardW + gap;
    }
  }

  // Pie: tagline + sitio.
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `24px ${bodyFont}`;
  ctx.fillText(data.t("home.tagline"), WIDTH / 2, HEIGHT - 110);

  ctx.fillStyle = theme.gold;
  ctx.font = `28px ${displayFont}`;
  ctx.fillText(data.siteUrl.replace(/^https?:\/\//, ""), WIDTH / 2, HEIGHT - 60);
}
