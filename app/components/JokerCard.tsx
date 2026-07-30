"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { CARD_ASPECT, RARITY_CLASS, type Joker } from "../lib/jokers";

/**
 * Cara de un comodín con su lámina holográfica. La comparten la pantalla de
 * hallazgo (a tamaño grande, girando) y la cabecera de la partida (en
 * miniatura, mientras el comodín está guardado), así que el brillo y los
 * colores de rareza se definen en un solo sitio.
 *
 * @param width    ancho en píxeles; el alto sale de la proporción de la carta.
 * @param children capas extra que van por encima del holograma.
 */
export default function JokerCard({
  joker,
  width,
  alt = "",
  className = "",
  children,
}: {
  joker: Joker;
  width: number;
  alt?: string;
  className?: string;
  children?: ReactNode;
}) {
  const height = Math.round(width / CARD_ASPECT);

  return (
    <span
      style={{ width, height }}
      className={`relative block overflow-hidden ${RARITY_CLASS[joker.rarity]} ${className}`}
    >
      <Image
        src={joker.image}
        alt={alt}
        width={width}
        height={height}
        priority
        className="h-full w-full"
      />
      <span aria-hidden className="holo-foil pointer-events-none absolute inset-0" />
      <span
        aria-hidden
        className="holo-sparkle pointer-events-none absolute inset-0"
      />
      <span
        aria-hidden
        className="holo-glare pointer-events-none absolute inset-0"
      />
      {children}
    </span>
  );
}
