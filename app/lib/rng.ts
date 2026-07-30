import { uniformFloat64 } from "pure-rand/distribution/uniformFloat64";
import { uniformInt } from "pure-rand/distribution/uniformInt";
import { xoroshiro128plus } from "pure-rand/generator/xoroshiro128plus";

/**
 * Aleatoriedad con semilla: toda partida nace de un seed y ese seed decide
 * palabras, barajado y comodines. Mismo seed => misma partida, palabra por
 * palabra, lo que permite compartirla o repetirla.
 *
 * Regla: nada de Math.random() en la lógica de juego. Se pide un Rng al
 * empezar la partida y se pasa a quien necesite tirar el dado.
 */

/**
 * Alfabeto de los seeds visibles. Sin I, L, O, U, 0 ni 1: son las que se
 * confunden al leer o dictar un código.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** Longitud del seed generado, en caracteres del alfabeto. */
const SEED_LENGTH = 8;

/** Tamaño de los grupos separados por guion ("K7P2-9MQX"). */
const GROUP_SIZE = 4;

/**
 * Crea el seed de una partida nueva: un código corto, legible y compartible.
 *
 * Usa entropía real, así que NO se puede llamar durante el render (rompe la
 * hidratación al no coincidir servidor y cliente): llamarlo al pulsar
 * "Jugar" o dentro de un efecto.
 */
export function newSeed(): string {
  const bytes = new Uint8Array(SEED_LENGTH);
  const webCrypto = globalThis.crypto;

  if (webCrypto?.getRandomValues) {
    webCrypto.getRandomValues(bytes);
  } else {
    // Sin Web Crypto (entornos viejos): el seed no necesita ser seguro,
    // solo distinto en cada partida.
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    if (i > 0 && i % GROUP_SIZE === 0) out += "-";
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Deja un seed escrito a mano en forma canónica: mayúsculas, sin espacios y
 * con los guiones en su sitio. Todo lo que no esté en ALPHABET se descarta,
 * incluidas las letras excluidas justamente por confundirse (I, L, O, U).
 *
 * Devuelve null si no queda nada aprovechable.
 */
export function normalizeSeed(input: string): string | null {
  const cleaned = [...input.toUpperCase()]
    .filter((char) => ALPHABET.includes(char))
    .join("");

  if (cleaned.length === 0) return null;

  const groups: string[] = [];
  for (let i = 0; i < cleaned.length; i += GROUP_SIZE) {
    groups.push(cleaned.slice(i, i + GROUP_SIZE));
  }
  return groups.join("-");
}

/**
 * Convierte el seed de texto en el entero de 32 bits que espera pure-rand.
 * FNV-1a: rápido, estable entre ejecuciones y bien repartido para cadenas
 * cortas (importa: dos seeds parecidos deben dar partidas distintas).
 */
export function seedToInt(seed: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash | 0;
}

/** Dado de una partida. Cada llamada avanza el estado interno. */
export type Rng = {
  /** El seed que lo originó, para mostrarlo o guardarlo en la partida. */
  readonly seed: string;
  /** Decimal en [0, 1), reemplazo directo de Math.random(). */
  float(): number;
  /** Entero en [0, maxExclusive). Devuelve 0 si el rango está vacío. */
  int(maxExclusive: number): number;
  /** Un elemento al azar, o undefined si la lista está vacía. */
  pick<T>(items: readonly T[]): T | undefined;
  /** Copia barajada (Fisher-Yates), sin tocar el original. */
  shuffle<T>(items: readonly T[]): T[];
  /**
   * Copia independiente en el punto exacto en que está. Útil para simular
   * una tirada sin gastarla en la partida real.
   */
  fork(): Rng;
};

/**
 * Abre el dado de una partida a partir de su seed.
 *
 * @param seed  el código de la partida; por defecto uno nuevo.
 */
export function createRng(seed: string = newSeed()): Rng {
  return rngFrom(seed, xoroshiro128plus(seedToInt(seed)));
}

type Generator = ReturnType<typeof xoroshiro128plus>;

function rngFrom(seed: string, generator: Generator): Rng {
  const rng: Rng = {
    seed,

    float() {
      return uniformFloat64(generator);
    },

    int(maxExclusive) {
      if (maxExclusive <= 1) return 0;
      return uniformInt(generator, 0, maxExclusive - 1);
    },

    pick(items) {
      if (items.length === 0) return undefined;
      return items[rng.int(items.length)];
    },

    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },

    fork() {
      return rngFrom(seed, generator.clone() as Generator);
    },
  };

  return rng;
}
