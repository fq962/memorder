"use client";

import { useRef, type ReactNode } from "react";
import { getMasterVolume } from "../lib/sounds";

/**
 * Envuelve contenido y reproduce un audio mientras el puntero está encima.
 * Al salir, para y rebobina para que el siguiente hover empiece de cero.
 *
 * El elemento se crea perezosamente en el primer hover: así no se descarga el
 * audio en la carga inicial de la página.
 */
export default function HoverSound({
  src,
  volume = 0.6,
  children,
}: {
  src: string;
  volume?: number;
  children: ReactNode;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);

  function start() {
    if (!audio.current) {
      audio.current = new Audio(src);
    }
    // Se relee en cada hover: el volumen global puede haber cambiado desde
    // el menú de opciones sin que este audio se vuelva a crear.
    audio.current.volume = volume * getMasterVolume();
    // La política de autoplay puede rechazarlo si el usuario aún no ha
    // interactuado con la página; en ese caso simplemente no suena.
    void audio.current.play().catch(() => {});
  }

  function stop() {
    if (!audio.current) return;
    audio.current.pause();
    audio.current.currentTime = 0;
  }

  return (
    <div onPointerEnter={start} onPointerLeave={stop}>
      {children}
    </div>
  );
}
