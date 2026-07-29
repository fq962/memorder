import { WORDS, type Difficulty } from "./words";

export type Round = {
  /** Orden correcto que el jugador debe reconstruir. */
  words: string[];
  /** Milisegundos que se muestra cada palabra. */
  perWordMs: number;
  totalMs: number;
};

/** Palabras por ronda según la tabla de progresión. */
export function wordCountFor(round: number): number {
  const table = [3, 4, 5, 5, 6, 7, 8, 9, 10];
  if (round <= table.length) return table[round - 1];
  // A partir de la ronda 10: una palabra más cada dos rondas, máximo 15.
  return Math.min(15, 10 + Math.ceil((round - 9) / 2));
}

/** Categorías de longitud permitidas en cada ronda. */
export function poolsFor(round: number): Difficulty[] {
  switch (round) {
    case 1:
    case 2:
      return ["easy"];
    case 3:
      return ["easy", "medium"];
    case 4:
    case 5:
      return ["medium"];
    case 6:
      return ["medium", "hard"];
    case 7:
    case 8:
      return ["hard"];
    default:
      return ["easy", "medium", "hard"];
  }
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Baraja garantizando que el resultado no coincida con el orden original. */
export function shuffleDistinct(words: string[]): string[] {
  if (words.length < 2) return [...words];
  let out = shuffle(words);
  let guard = 0;
  while (out.every((w, i) => w === words[i]) && guard++ < 20) {
    out = shuffle(words);
  }
  return out;
}

/**
 * Tiempo de memorización: 1s por palabra + 0.15s por letra promedio.
 * Ajusta estas dos constantes para hacer el juego más o menos exigente.
 */
const MS_PER_WORD = 1000;
const MS_PER_AVERAGE_LETTER = 150;

export function memorizeMs(words: string[]): number {
  const letters = words.reduce((sum, w) => sum + w.length, 0);
  const average = letters / words.length;
  return words.length * MS_PER_WORD + average * MS_PER_AVERAGE_LETTER;
}

export function buildRound(round: number, recentWords: string[]): Round {
  const count = wordCountFor(round);
  const pool = poolsFor(round).flatMap((level) => [...WORDS[level]]);
  const recent = new Set(recentWords);

  // Se evitan las palabras de las últimas rondas salvo que no queden suficientes.
  const fresh = pool.filter((w) => !recent.has(w));
  const source = fresh.length >= count ? fresh : pool;

  const words = shuffle(source).slice(0, count);
  const totalMs = memorizeMs(words);

  return { words, totalMs, perWordMs: totalMs / words.length };
}

/* =========================================================
   Puntuación
   ---------------------------------------------------------
   Los puntos de cada palabra acertada salen de tres factores:

     puntos = (BASE + bonus de longitud) x mult. de cantidad x mult. de rapidez

   1. Longitud de la palabra: cuanto más larga, más cuesta memorizarla.
   2. Cantidad de palabras de la ronda: ordenar 12 es mucho más difícil que 3.
   3. Tiempo empleado en ordenar: resolver rápido multiplica; agotar el
      cronómetro no penaliza, simplemente no da extra.
   ========================================================= */

/** Puntos base de cualquier palabra acertada, antes de bonus y multiplicadores. */
const BASE_POINTS = 10;

/** Extra por palabra larga (mismo tramo que las categorías de dificultad). */
export function lengthBonus(word: string): number {
  if (word.length <= 5) return 0;
  if (word.length <= 8) return 5;
  if (word.length <= 11) return 10;
  return 15;
}

/**
 * Multiplicador por cantidad de palabras en la ronda: +12% por cada palabra
 * más allá de la ronda mínima (3). Con 3 vale 1; con 15, 2.44.
 */
export function countMultiplier(count: number): number {
  return 1 + Math.max(0, count - 3) * 0.12;
}

/** Rapidez máxima: resolver al instante multiplica los puntos por 1.6. */
const MAX_SPEED_MULTIPLIER = 1.6;

/**
 * Multiplicador por tiempo empleado en ordenar. Decae de forma lineal desde
 * MAX_SPEED_MULTIPLIER (respuesta instantánea) hasta 1 al agotarse el límite.
 */
export function speedMultiplier(elapsedMs: number, limitMs: number): number {
  if (limitMs <= 0) return 1;
  const left = Math.min(1, Math.max(0, 1 - elapsedMs / limitMs));
  return 1 + (MAX_SPEED_MULTIPLIER - 1) * left;
}

/**
 * Puntos de una sola palabra acertada, ya con los tres factores aplicados.
 * @param count  palabras que tenía la ronda.
 * @param speed  multiplicador devuelto por speedMultiplier.
 */
export function wordPoints(word: string, count: number, speed = 1): number {
  const base = BASE_POINTS + lengthBonus(word);
  return Math.round(base * countMultiplier(count) * speed);
}

/** Bonus Perfect: 25% extra si toda la ronda es correcta. */
export function perfectBonus(words: string[], speed = 1): number {
  const total = words.reduce(
    (sum, w) => sum + wordPoints(w, words.length, speed),
    0,
  );
  return Math.round(total * 0.25);
}

/** Mueve un elemento de una posición a otra sin alterar el resto. */
export function move<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
