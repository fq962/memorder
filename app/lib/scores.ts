// Servicio de puntuaciones: guardar la partida terminada y traer el ranking.
//
// Sin React a propósito (lo consumen una página y un efecto, no un contexto):
// dos funciones sueltas contra Supabase. Si el cliente no está configurado
// (faltan las env vars) las dos devuelven vacío en vez de tirar, igual que el
// resto de la app.
import { supabase } from "./supabase";
import type { Language } from "./i18n";

/** Partida terminada, tal como se guarda en la tabla `scores`. */
export type Run = {
  score: number;
  roundReached: number;
  wordsCorrect: number;
  /** Semilla de la run: permite reproducirla y auditar el puntaje. */
  seed: string;
  /** Idioma en que se jugó: los puntajes entre bancos no son comparables. */
  language: Language;
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
