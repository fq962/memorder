// Diccionario de traducciones de la interfaz (ES/EN).
//
// Las claves son planas y con prefijo por pantalla. No incluye las palabras
// del juego (ver app/play/words.ts): eso es contenido, no interfaz.

export type Language = "es" | "en";

export const LANGUAGE_OPTIONS: { code: Language; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

const es = {
  "home.tagline": "memoriza · o llora",
  "home.descriptionPre":
    "Memoriza el orden de las palabras y reconstrúyelo. Un error y",
  "home.descriptionBoom": "boom 💥",
  "home.rankingTitle": "TOP CEREBROS",

  "play.round": "RONDA",
  "play.idleDescriptionPre":
    "Memoriza el orden en el que aparecen las palabras. Después reconstrúyelo arrastrándolas.",
  "play.idleDescriptionBold": "Un solo error",
  "play.idleDescriptionPost": "termina la partida.",
  "play.start": "▶ COMENZAR",

  "play.showingHint": "MEMORIZA EL ORDEN 👀",

  "play.checkingLabel": "Comprobando el orden… 🎰",
  "play.arrangeHint":
    "Arrástralas al orden original — o toca una y luego otra para intercambiarlas. 🃏",
  "play.keyboardHint":
    "Teclado: ↑ ↓ para elegir, un número para soltarla, Enter para comprobar.",
  "play.wordsChip": "PALABRAS",
  "play.speedChip": "RAPIDEZ",
  "play.ready": "¡LISTO! ✅",

  "play.gameoverScore": "Puntuación",
  "play.gameoverRoundReached": "Ronda alcanzada",
  "play.gameoverWordsCorrect": "Palabras acertadas",
  "play.gameoverCorrectOrder": "El orden correcto era:",
  "play.gameoverRetry": "🔁 OTRA VEZ",
  "play.gameoverRanking": "RANKING",

  "settings.open": "Ajustes",
  "settings.title": "OPCIONES",
  "settings.volume": "Volumen",
  "settings.language": "Idioma",
  "settings.theme": "Tema",
  "settings.close": "Cerrar",
} as const;

const en: Record<keyof typeof es, string> = {
  "home.tagline": "memorize · or cry",
  "home.descriptionPre":
    "Memorize the order of the words and rebuild it. One mistake and",
  "home.descriptionBoom": "boom 💥",
  "home.rankingTitle": "TOP BRAINS",

  "play.round": "ROUND",
  "play.idleDescriptionPre":
    "Memorize the order the words appear in. Then rebuild it by dragging them.",
  "play.idleDescriptionBold": "One mistake",
  "play.idleDescriptionPost": "ends the run.",
  "play.start": "▶ START",

  "play.showingHint": "MEMORIZE THE ORDER 👀",

  "play.checkingLabel": "Checking the order… 🎰",
  "play.arrangeHint":
    "Drag them into the original order — or tap one, then another, to swap them. 🃏",
  "play.keyboardHint":
    "Keyboard: ↑ ↓ to select, a number to drop it, Enter to check.",
  "play.wordsChip": "WORDS",
  "play.speedChip": "SPEED",
  "play.ready": "READY! ✅",

  "play.gameoverScore": "Score",
  "play.gameoverRoundReached": "Round reached",
  "play.gameoverWordsCorrect": "Words correct",
  "play.gameoverCorrectOrder": "The correct order was:",
  "play.gameoverRetry": "🔁 TRY AGAIN",
  "play.gameoverRanking": "RANKING",

  "settings.open": "Settings",
  "settings.title": "OPTIONS",
  "settings.volume": "Volume",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.close": "Close",
};

export type TranslationKey = keyof typeof es;

export const translations: Record<Language, Record<TranslationKey, string>> = {
  es,
  en,
};
