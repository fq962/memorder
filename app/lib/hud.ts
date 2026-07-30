"use client";

import { useSyncExternalStore } from "react";

/**
 * Señal de "hay una partida en curso", para que los adornos que viven en el
 * layout (el botón de ajustes) se quiten de en medio mientras se juega.
 *
 * Es un store aparte del de ajustes a propósito: aquel persiste en
 * localStorage y esto es estado de pantalla, que muere con la sesión.
 */
let playing = false;
const listeners = new Set<() => void>();

export function setPlaying(next: boolean) {
  if (playing === next) return;
  playing = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsPlaying(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => playing,
    () => false,
  );
}
