// Servicio de puntuaciones: guardar la partida terminada y traer el ranking.
//
// Sin React a propósito (lo consumen una página y un efecto, no un contexto):
// dos funciones sueltas contra Supabase. Si el cliente no está configurado
// (faltan las env vars) las dos devuelven vacío en vez de tirar, igual que el
// resto de la app.
import { supabase } from "./supabase";
import type { Language } from "./i18n";
import type { JokerId } from "./jokers";

/** Partida terminada, tal como se guarda en la tabla `scores`. */
export type Run = {
  score: number;
  roundReached: number;
  wordsCorrect: number;
  /** Semilla de la run: permite reproducirla y auditar el puntaje. */
  seed: string;
  /** Idioma en que se jugó: los puntajes entre bancos no son comparables. */
  language: Language;
  /** Comodines que cayeron durante la run, en el orden en que aparecieron. */
  jokers: JokerId[];
};

/** Una fila del ranking: el mejor puntaje de un usuario. */
export type LeaderboardEntry = {
  userId: string;
  /** Puesto, empezando en 1. */
  rank: number;
  name: string;
  score: number;
  seed: string | null;
};

/**
 * Guarda una partida. Requiere sesión: la política RLS de la tabla solo
 * acepta filas cuyo user_id sea el del usuario logueado.
 *
 * Devuelve si se guardó, para que quien llame pueda avisar (o callarse): una
 * partida perdida no debería romper la pantalla de Game Over.
 */
export async function saveScore(userId: string, run: Run): Promise<boolean> {
  const client = supabase;
  if (!client) return false;

  const { error } = await client.from("scores").insert({
    user_id: userId,
    score: run.score,
    round_reached: run.roundReached,
    words_correct: run.wordsCorrect,
    seed: run.seed,
    language: run.language,
    jokers: run.jokers,
  });

  if (error) {
    console.error("No se pudo guardar la puntuación:", error.message);
    return false;
  }
  return true;
}

/** Fila cruda que devuelve la función `leaderboard` de Supabase. */
type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  score: number;
  seed: string | null;
};

/**
 * Trae el ranking: el mejor puntaje de cada usuario, de mayor a menor.
 *
 * Va por RPC y no por un select con join porque la función es SECURITY
 * DEFINER: necesita leer el display_name de los demás usuarios, y las
 * políticas de `profiles` restringen eso a la fila propia.
 *
 * Devuelve null si la consulta falla, para que la pantalla pueda distinguir
 * "no hay puntajes" (una lista vacía, que es información buena) de "no se
 * pudo cargar" (un fallo, que no hay que disfrazar de tabla vacía).
 */
export async function fetchLeaderboard(
  limit = 100,
): Promise<LeaderboardEntry[] | null> {
  const client = supabase;
  if (!client) return null;

  const { data, error } = await client.rpc("leaderboard", { max_rows: limit });
  if (error || !data) {
    if (error) console.error("No se pudo cargar el ranking:", error.message);
    return null;
  }

  return (data as LeaderboardRow[]).map((row, i) => ({
    userId: row.user_id,
    rank: i + 1,
    // Un perfil sin nombre elegido todavía no debería salir en blanco.
    name: row.display_name ?? "anónimo",
    score: row.score,
    seed: row.seed,
  }));
}

/** Una partida propia, tal como se lista en el historial. */
export type HistoryEntry = {
  score: number;
  roundReached: number;
  wordsCorrect: number;
  seed: string;
  jokers: JokerId[];
  createdAt: string;
};

/** Fila cruda de la tabla `scores`, tal como la trae el select del historial. */
type HistoryRow = {
  score: number;
  round_reached: number;
  words_correct: number;
  seed: string;
  jokers: JokerId[] | null;
  created_at: string;
};

/**
 * Trae las partidas del propio usuario, de la más reciente a la más vieja.
 *
 * A diferencia del ranking, va por un select directo (no por RPC): solo lee
 * las filas propias, y la policy `scores_select_own` (ver la migración SQL)
 * es la que lo permite bajo RLS.
 *
 * Devuelve null si la consulta falla, mismo criterio que fetchLeaderboard.
 */
export async function fetchHistory(
  userId: string,
  limit = 50,
): Promise<HistoryEntry[] | null> {
  const client = supabase;
  if (!client) return null;

  const { data, error } = await client
    .from("scores")
    .select("score, round_reached, words_correct, seed, jokers, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("No se pudo cargar el historial:", error.message);
    return null;
  }

  return (data as HistoryRow[]).map((row) => ({
    score: row.score,
    roundReached: row.round_reached,
    wordsCorrect: row.words_correct,
    seed: row.seed,
    jokers: row.jokers ?? [],
    createdAt: row.created_at,
  }));
}
