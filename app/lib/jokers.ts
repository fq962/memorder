// Catálogo de comodines. Cada uno apunta a su carta (public/cards) y a las
// claves de i18n de su nombre y su descripción, para que la pantalla de
// hallazgo sirva igual para todos sin tocar el componente.
import type { TranslationKey } from "./i18n";

/** Reverso común a todas las cartas: la cara con la que empieza el giro. */
export const CARD_BACK = "/cards/back.webp";

/** Proporción de las cartas recortadas (ancho / alto). */
export const CARD_ASPECT = 326 / 446;

export type JokerId = "free-order";

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
 */
export const DROP_CHANCE: Record<Rarity, number> = {
  legendary: 0.05,
  epic: 0.2,
  bronze: 0.4,
};

/** Rarezas en el orden en que se comprueban al tirar. */
const ROLL_ORDER: Rarity[] = ["legendary", "epic", "bronze"];

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
};

/**
 * Tirada de una ronda: devuelve el comodín que aparece, o null si esta vez no
 * sale ninguno.
 *
 * Si la rareza que toca todavía no tiene cartas (hoy solo hay épicas), la
 * tirada se queda sin premio en vez de repartir otra rareza: así el 20% de la
 * épica sigue siendo un 20% y no se infla con las tiradas de bronce.
 */
export function rollJoker(): JokerId | null {
  const roll = Math.random();
  let acc = 0;

  for (const rarity of ROLL_ORDER) {
    acc += DROP_CHANCE[rarity];
    if (roll >= acc) continue;

    const pool = Object.values(JOKERS).filter((j) => j.rarity === rarity);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)].id;
  }

  return null;
}
