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
  "auth.signIn": "Iniciar sesión con Google",
  "auth.signOut": "Cerrar sesión",
  "auth.notConfigured": "Supabase no configurado",

  "profile.title": "Tu perfil",
  "profile.username": "Nombre de usuario",
  "profile.usernamePlaceholder": "tu_nombre",
  "profile.save": "Guardar",
  "profile.saving": "Guardando…",
  "profile.saved": "¡Listo!",
  "profile.usernameTaken": "Ese nombre ya está en uso.",
  "profile.usernameInvalid":
    "Usa entre 3 y 20 caracteres: letras, números o guion bajo.",
  "profile.genericError": "No se pudo guardar. Probá de nuevo.",
  "profile.cooldownNotice":
    "Solo podés cambiarlo una vez cada 3 meses. Si lo cambiás ahora, no podrás volver a hacerlo hasta el",
  "profile.cooldownActive": "Ya cambiaste tu nombre hace poco. Podrás volver a hacerlo el",
  "profile.savedUntil": "Listo. No podrás cambiarlo de nuevo hasta el",

  "home.tagline": "memoriza · o llora",
  "home.descriptionPre":
    "Memoriza el orden de las palabras y reconstrúyelo. Un error y",
  "home.descriptionBoom": "boom 💥",
  "home.rankingTitle": "TOP CEREBROS",
  "home.rankingLoading": "CARGANDO PUNTAJES…",
  "home.rankingEmpty":
    "Todavía no hay puntajes. Jugá una partida y estrenalo vos.",
  "home.rankingError": "No se pudo cargar el ranking. Probá de nuevo más tarde.",

  "play.round": "RONDA",
  "play.idleDescriptionPre":
    "Memoriza el orden en el que aparecen las palabras. Después reconstrúyelo arrastrándolas.",
  "play.idleDescriptionBold": "Un solo error",
  "play.idleDescriptionPost": "termina la partida.",
  "play.start": "▶ COMENZAR",
  "play.seedEntryToggle": "🎲 JUGAR UNA SEMILLA",
  "play.seedEntryLabel": "Pega la semilla de una partida",
  "play.seedEntryPlay": "JUGAR",
  "play.seedEntryHint": "Misma semilla, mismas palabras y mismos comodines.",
  "play.seedEntryWillPlay": "Se jugará:",
  "play.seedEntryInvalid": "Esa semilla no tiene caracteres válidos.",

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
  "play.gameoverSeed": "Semilla de la partida",
  "play.gameoverSeedHint": "toca para copiar",
  "play.gameoverSeedCopied": "¡COPIADO! ✅",
  "play.gameoverSameSeed": "🔁 MISMA SEMILLA",
  "play.gameoverRetry": "🔁 OTRA VEZ",
  "play.gameoverRanking": "RANKING",
  "play.gameoverLoginBanner":
    "Iniciá sesión para guardar esta puntuación y que aparezca en el ranking.",
  "play.gameoverLoginBannerCustom":
    "Iniciá sesión para guardar esta partida en tu historial. No suma al ranking: jugaste con una semilla elegida.",
  "play.gameoverLoginCta": "Iniciar sesión y guardar",
  "play.gameoverCustomSeedNotice":
    "Esta partida no cuenta para el ranking: jugaste con una semilla elegida. Ya quedó guardada en tu historial.",
  "play.gameoverShare": "📤 COMPARTIR",
  "play.gameoverShareGenerating": "Generando…",
  "play.gameoverShareFallbackHint":
    "Se descargó tu tarjeta. Adjuntala en WhatsApp para compartirla.",
  "share.inviteText":
    "Llegué a la ronda {round} con {score} puntos en MEMORDER 🧠🔥 ¿Te animás a superarme?",
  "share.jokersLabel": "COMODINES CONSEGUIDOS",

  "history.title": "MIS PARTIDAS",
  "history.loading": "CARGANDO HISTORIAL…",
  "history.error": "No se pudo cargar el historial. Probá de nuevo más tarde.",
  "history.empty": "Todavía no jugaste ninguna partida logueado.",
  "history.loginCta": "Iniciá sesión para ver tu historial de partidas.",
  "history.round": "Ronda",
  "history.score": "Puntos",
  "history.jokersNone": "—",
  "history.customBadge": "semilla propia",
  "home.historyLink": "Historial",

  "userProfile.loading": "CARGANDO PERFIL…",
  "userProfile.error": "No se pudo cargar el perfil. Probá de nuevo más tarde.",
  "userProfile.officialSection": "Mejores runs oficiales",
  "userProfile.officialHint": "Semilla al azar: las que cuentan para el ranking.",
  "userProfile.customSection": "Mejores runs con semilla propia",
  "userProfile.customHint": "Semilla elegida: no suman al ranking.",
  "userProfile.empty": "Todavía no hay partidas en esta categoría.",

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
  "auth.signIn": "Sign in with Google",
  "auth.signOut": "Sign out",
  "auth.notConfigured": "Supabase not configured",

  "profile.title": "Your profile",
  "profile.username": "Username",
  "profile.usernamePlaceholder": "your_name",
  "profile.save": "Save",
  "profile.saving": "Saving…",
  "profile.saved": "Done!",
  "profile.usernameTaken": "That name is already taken.",
  "profile.usernameInvalid":
    "Use 3 to 20 characters: letters, numbers, or underscore.",
  "profile.genericError": "Couldn't save it. Try again.",
  "profile.cooldownNotice":
    "You can only change it once every 3 months. If you change it now, you won't be able to again until",
  "profile.cooldownActive": "You changed your name recently. You'll be able to again on",
  "profile.savedUntil": "Done. You won't be able to change it again until",

  "home.tagline": "memorize · or cry",
  "home.descriptionPre":
    "Memorize the order of the words and rebuild it. One mistake and",
  "home.descriptionBoom": "boom 💥",
  "home.rankingTitle": "TOP BRAINS",
  "home.rankingLoading": "LOADING SCORES…",
  "home.rankingEmpty": "No scores yet. Play a run and be the first.",
  "home.rankingError": "Couldn't load the ranking. Try again later.",

  "play.round": "ROUND",
  "play.idleDescriptionPre":
    "Memorize the order the words appear in. Then rebuild it by dragging them.",
  "play.idleDescriptionBold": "One mistake",
  "play.idleDescriptionPost": "ends the run.",
  "play.start": "▶ START",
  "play.seedEntryToggle": "🎲 PLAY A SEED",
  "play.seedEntryLabel": "Paste a run seed",
  "play.seedEntryPlay": "PLAY",
  "play.seedEntryHint": "Same seed, same words and same jokers.",
  "play.seedEntryWillPlay": "Will play:",
  "play.seedEntryInvalid": "That seed has no valid characters.",

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
  "play.gameoverSeed": "Run seed",
  "play.gameoverSeedHint": "tap to copy",
  "play.gameoverSeedCopied": "COPIED! ✅",
  "play.gameoverSameSeed": "🔁 SAME SEED",
  "play.gameoverRetry": "🔁 TRY AGAIN",
  "play.gameoverRanking": "RANKING",
  "play.gameoverLoginBanner":
    "Sign in to save this score and get it on the leaderboard.",
  "play.gameoverLoginBannerCustom":
    "Sign in to save this run to your history. It won't count for the leaderboard: you played a chosen seed.",
  "play.gameoverLoginCta": "Sign in and save",
  "play.gameoverCustomSeedNotice":
    "This run doesn't count for the leaderboard: you played a chosen seed. It's already saved to your history.",
  "play.gameoverShare": "📤 SHARE",
  "play.gameoverShareGenerating": "Generating…",
  "play.gameoverShareFallbackHint":
    "Your card was downloaded. Attach it on WhatsApp to share it.",
  "share.inviteText":
    "I reached round {round} with {score} points on MEMORDER 🧠🔥 Think you can beat me?",
  "share.jokersLabel": "JOKERS EARNED",

  "history.title": "MY RUNS",
  "history.loading": "LOADING HISTORY…",
  "history.error": "Couldn't load your history. Try again later.",
  "history.empty": "You haven't played any signed-in runs yet.",
  "history.loginCta": "Sign in to see your run history.",
  "history.round": "Round",
  "history.score": "Score",
  "history.jokersNone": "—",
  "history.customBadge": "chosen seed",
  "home.historyLink": "History",

  "userProfile.loading": "LOADING PROFILE…",
  "userProfile.error": "Couldn't load this profile. Try again later.",
  "userProfile.officialSection": "Best official runs",
  "userProfile.officialHint": "Random seed: these count for the leaderboard.",
  "userProfile.customSection": "Best chosen-seed runs",
  "userProfile.customHint": "Chosen seed: these don't count for the leaderboard.",
  "userProfile.empty": "No runs in this category yet.",

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
