// Catálogo de comodines. Cada uno apunta a su carta (public/cards) y a las
// claves de i18n de su nombre y su descripción, para que la pantalla de
// hallazgo sirva igual para todos sin tocar el componente.
import type { TranslationKey } from "./i18n";
import type { Rng } from "./rng";

/** Reverso común a todas las cartas: la cara con la que empieza el giro. */
export const CARD_BACK = "/cards/back.webp";

/** Proporción de las cartas recortadas (ancho / alto). */
export const CARD_ASPECT = 326 / 446;

export type JokerId = "free-order" | "x1-5";

/**
 * Rareza del comodín. Decide el color de la lámina holográfica y del halo:
 * cada valor tiene su clase `holo-*` en globals.css con sus variables.
 */
export type Rarity = "bronze" | "epic" | "legendary";

export const RARITY_CLASS: Record<Rarity, string> = {
  bronze: "holo-bronze",
  epic: "holo-epic",
  legendary: "holo-legendary",
};

export const RARITY_LABEL_KEY: Record<Rarity, TranslationKey> = {
  bronze: "joker.rarity.bronze",
  epic: "joker.rarity.epic",
  legendary: "joker.rarity.legendary",
};

/**
 * Probabilidad de que la tirada de una ronda saque un comodín de cada rareza.
 * Se comprueban de la más rara a la más común, así que cada una conserva
 * exactamente su porcentaje; lo que sobra (35%) es la ronda sin premio.
 *
 * Estos son los valores de fábrica. El menú de ajustes puede sobrescribirlos
 * en caliente con el código de trucos (ver setDropChance).
 */
export const DEFAULT_DROP_CHANCE: Record<Rarity, number> = {
  legendary: 0.05,
  epic: 0.2,
  bronze: 0.4,
};

/** Rarezas en el orden en que se comprueban al tirar. */
export const ROLL_ORDER: Rarity[] = ["legendary", "epic", "bronze"];

// Copia viva que usa rollJoker. Se mantiene fuera de React a propósito: la
// tirada ocurre dentro de la lógica de juego, no en un render.
let dropChance: Record<Rarity, number> = { ...DEFAULT_DROP_CHANCE };

export function setDropChance(next: Record<Rarity, number>) {
  dropChance = { ...next };
}

export function getDropChance(): Record<Rarity, number> {
  return dropChance;
}

/**
 * Reparto real que produce la tabla, incluida la probabilidad de no sacar
 * nada. Como las rarezas se comprueban en orden, si los porcentajes suman más
 * de 100 las últimas se quedan con lo que queda: esto lo hace visible.
 */
export function effectiveShares(
  chance: Record<Rarity, number> = dropChance,
): Record<Rarity | "none", number> {
  let left = 1;
  const out = {} as Record<Rarity | "none", number>;
  for (const rarity of ROLL_ORDER) {
    const share = Math.max(0, Math.min(chance[rarity], left));
    out[rarity] = share;
    left -= share;
  }
  out.none = left;
  return out;
}

export type Joker = {
  id: JokerId;
  /** Cara frontal, en public/cards. */
  image: string;
  rarity: Rarity;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
};

export const JOKERS: Record<JokerId, Joker> = {
  "free-order": {
    id: "free-order",
    image: "/cards/free-order.webp",
    rarity: "epic",
    nameKey: "joker.freeOrder.name",
    descriptionKey: "joker.freeOrder.description",
  },
  "x1-5": {
    id: "x1-5",
    image: "/cards/x1-5.webp",
    rarity: "bronze",
    nameKey: "joker.x15.name",
    descriptionKey: "joker.x15.description",
  },
};

/** Multiplicador de puntos que aplica el comodín ×1.5 a su ronda. */
export const X15_BOOST = 1.5;

/**
 * Tirada de una ronda: devuelve el comodín que aparece, o null si esta vez no
 * sale ninguno.
 *
 * Si la rareza que toca todavía no tiene cartas (hoy solo hay épicas), la
 * tirada se queda sin premio en vez de repartir otra rareza: así el 20% de la
 * épica sigue siendo un 20% y no se infla con las tiradas de bronce.
 *
 * @param rng  el dado de la partida (ver app/lib/rng.ts): las cartas que
 *             caen son parte de lo que reproduce el seed.
 */
export function rollJoker(rng: Rng): JokerId | null {
  const roll = rng.float();
  let acc = 0;

  for (const rarity of ROLL_ORDER) {
    acc += dropChance[rarity];
    if (roll >= acc) continue;

    const pool = Object.values(JOKERS).filter((j) => j.rarity === rarity);
    if (pool.length === 0) return null;
    return rng.pick(pool)!.id;
  }

  return null;
}
