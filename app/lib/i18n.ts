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
  "play.jokerChip": "COMODÍN",
  "play.ready": "¡LISTO! ✅",

  "joker.found": "¡COMODÍN ENCONTRADO!",
  "joker.continue": "CONTINUAR ▶",
  "joker.rarity.bronze": "BRONCE",
  "joker.rarity.epic": "ÉPICA",
  "joker.rarity.legendary": "LEGENDARIA",
  "joker.freeOrder.name": "Free Order",
  "joker.freeOrder.description":
    "En la próxima ronda, una palabra ya saldrá colocada en su posición correcta y marcada en verde.",
  "joker.held": "Comodín guardado",
  "joker.inUse": "Comodín en uso esta ronda",
  "joker.freeOrderTag": "GRATIS",
  "joker.x15.name": "×1.5 Puntos",
  "joker.x15.description":
    "En la próxima ronda, todos los puntos que consigas se multiplican por 1.5.",

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
  "settings.code": "Código",
  "settings.codePlaceholder": "Introduce un código",
  "settings.codeApply": "OK",
  "settings.codeWrong": "Código incorrecto",
  "settings.drops": "Probabilidad de comodín",
  "settings.dropsHint":
    "Se comprueban de la más rara a la más común: si suman más de 100%, las últimas se quedan con lo que sobra.",
  "settings.dropsNone": "Sin comodín",
  "settings.dropsReset": "Restaurar",
  "settings.words": "Palabras por ronda",
  "settings.wordsAuto": "AUTO",
  "settings.wordsHint":
    "AUTO sigue la progresión normal. Fijo se aplica desde la ronda siguiente.",
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
  "play.jokerChip": "JOKER",
  "play.ready": "READY! ✅",

  "joker.found": "JOKER FOUND!",
  "joker.continue": "CONTINUE ▶",
  "joker.rarity.bronze": "BRONZE",
  "joker.rarity.epic": "EPIC",
  "joker.rarity.legendary": "LEGENDARY",
  "joker.freeOrder.name": "Free Order",
  "joker.freeOrder.description":
    "Next round, one word already starts in its correct spot, marked in green.",
  "joker.held": "Joker in hand",
  "joker.inUse": "Joker active this round",
  "joker.freeOrderTag": "FREE",
  "joker.x15.name": "×1.5 Points",
  "joker.x15.description":
    "Next round, every point you score is multiplied by 1.5.",

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
  "settings.code": "Code",
  "settings.codePlaceholder": "Enter a code",
  "settings.codeApply": "OK",
  "settings.codeWrong": "Wrong code",
  "settings.drops": "Joker drop rate",
  "settings.dropsHint":
    "Checked from rarest to most common: if they add up to over 100%, the last ones only get what's left.",
  "settings.dropsNone": "No joker",
  "settings.dropsReset": "Reset",
  "settings.words": "Words per round",
  "settings.wordsAuto": "AUTO",
  "settings.wordsHint":
    "AUTO follows the normal progression. A fixed count kicks in from the next round.",
};

export type TranslationKey = keyof typeof es;

export const translations: Record<Language, Record<TranslationKey, string>> = {
  es,
  en,
};
