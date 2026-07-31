"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { CARD_ASPECT, RARITY_CLASS, type Joker } from "../lib/jokers";

/**
 * Una clase `absolute`/`fixed`/`sticky` en el className del caller ya fija la
 * posición del span: forzar además `relative` desde el propio componente
 * pisaría esa intención (dos utilidades de "position" en el mismo elemento
 * las decide el orden del stylesheet, no el orden del className, y ahí
 * `relative` puede ganarle a `absolute` aunque venga escrito antes). Por eso
 * solo se añade `relative` cuando el caller no trae ya su propio position.
 */
function positionClass(className: string): string {
  return /(?:^|\s)(?:absolute|fixed|sticky)(?:\s|$)/.test(className)
    ? ""
    : "relative";
}

/**
 * Cara de un comodín con su lámina holográfica. La comparten la pantalla de
 * hallazgo (a tamaño grande, girando) y la cabecera de la partida (en
 * miniatura, mientras el comodín está guardado), así que el brillo y los
 * colores de rareza se definen en un solo sitio.
 *
 * @param width     ancho en píxeles; el alto sale de la proporción de la carta.
 * @param animated  la lámina holográfica anima 3 capas en bucle infinito todo
 *                  el tiempo que la carta esté montada. En la carta grande de
 *                  hallazgo/elección eso dura lo que tarda en leerse y se
 *                  nota; en la miniatura de cabecera y en las filas del
 *                  historial se queda montada rondas enteras (o decenas de
 *                  filas a la vez) sin que se note el brillo, así que ahí se
 *                  apaga para no gastar ciclos de composición de balde.
 * @param priority  precarga la imagen sin esperar a que entre en viewport.
 *                  Tiene sentido para la única carta grande en pantalla
 *                  (hallazgo, elección, cabecera); en una lista como la del
 *                  historial, con varias filas y varios comodines cada una,
 *                  forzar precarga en todas competiría por ancho de banda de
 *                  balde con las que sí importan, así que ahí se desactiva.
 * @param children  capas extra que van por encima del holograma.
 */
export default function JokerCard({
  joker,
  width,
  alt = "",
  className = "",
  animated = true,
  priority = true,
  children,
}: {
  joker: Joker;
  width: number;
  alt?: string;
  className?: string;
  animated?: boolean;
  priority?: boolean;
  children?: ReactNode;
}) {
  const height = Math.round(width / CARD_ASPECT);

  return (
    <span
      style={{ width, height }}
      className={`${positionClass(className)} block overflow-hidden ${RARITY_CLASS[joker.rarity]} ${className}`}
    >
      <Image
        src={joker.image}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="h-full w-full"
      />
      {animated && (
        <>
          <span aria-hidden className="holo-foil pointer-events-none absolute inset-0" />
          <span
            aria-hidden
            className="holo-sparkle pointer-events-none absolute inset-0"
          />
          <span
            aria-hidden
            className="holo-glare pointer-events-none absolute inset-0"
          />
        </>
      )}
      {children}
    </span>
  );
}

/**
 * Reverso de un comodín: su propia carta, boca abajo y desenfocada, en vez
 * de un dorso genérico. Se escala un poco de más para que el desenfoque no
 * deje ver borde transparente, y un velo oscuro la aplana para que se lea
 * como reverso y no como la cara ya revelada.
 */
export function JokerCardBack({
  joker,
  width,
  className = "",
}: {
  joker: Joker;
  width: number;
  className?: string;
}) {
  const height = Math.round(width / CARD_ASPECT);

  return (
    <span
      style={{ width, height }}
      className={`${positionClass(className)} block overflow-hidden bg-black ${className}`}
    >
      <Image
        src={joker.image}
        alt=""
        aria-hidden
        width={width}
        height={height}
        className="h-full w-full scale-125 rotate-180 blur-md"
      />
      <span aria-hidden className="absolute inset-0 bg-black/45" />
    </span>
  );
}
