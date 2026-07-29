"use client";

import { useEffect, useRef, useState } from "react";

/** Umbral en el que el cronómetro se vuelve gigante detrás de las letras. */
const BIG_AT_MS = 3000;

function pad3(n: number) {
  return n.toString().padStart(3, "0");
}

/**
 * Cronómetro de memorización de precisión de milisegundos.
 *
 * - Mientras quedan > 3 s: chip discreto arriba con el tiempo corriendo (SS.mmm).
 * - Últimos 3 s: el chip desaparece y aparece un número ENORME detrás de las
 *   cartas (segundos + ms) que late para meter presión.
 *
 * Corre su propio requestAnimationFrame para no re-renderizar la lista de
 * palabras en cada frame. Llama a onDone una sola vez al llegar a cero.
 */
export default function MemorizeTimer({
  durationMs,
  onDone,
}: {
  durationMs: number;
  onDone: () => void;
}) {
  const [remaining, setRemaining] = useState(durationMs);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const left = Math.max(0, durationMs - (now - start));
      setRemaining(left);
      if (left <= 0) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDone();
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Respaldo por si la pestaña se oculta y rAF se congela.
    const settle = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        setRemaining(0);
        onDone();
      }
    }, durationMs + 120);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
    // Se reinicia solo si cambia la duración (ronda nueva monta el componente).
  }, [durationMs, onDone]);

  const secs = Math.floor(remaining / 1000);
  const ms = Math.floor(remaining % 1000);
  const isBig = remaining <= BIG_AT_MS;
  const progress = remaining / durationMs;

  return (
    <>
      {/* ---- Chip normal (arriba) ---- */}
      {!isBig && (
        <div className="fixed inset-x-0 top-0 z-30 flex flex-col items-center gap-1 pt-3">
          <div
            className={`card-base font-display flex items-center gap-2 px-4 py-2 text-sm tabular-nums transition-colors ${
              progress < 0.34
                ? "bg-chip-red text-cream"
                : "bg-card-face text-card-ink"
            }`}
          >
            <span aria-hidden>⏱️</span>
            <span>
              {secs}.<span className="text-[0.85em] opacity-80">{pad3(ms)}</span>
            </span>
          </div>
          {/* Barra que se agota. */}
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-black/40">
            <div
              className="bg-chip-gold h-full origin-left rounded-full shadow-[0_0_10px_rgba(255,203,43,0.8)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>
        </div>
      )}

      {/* ---- Número gigante detrás de las cartas (últimos 3 s) ---- */}
      {isBig && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-[1] flex items-center justify-center"
        >
          <div className="animate-pulse-big flex items-baseline text-chip-red [text-shadow:0_0_60px_rgba(255,77,94,0.9),6px_6px_0_rgba(0,0,0,0.4)]">
            <span className="font-display text-[38vw] leading-none sm:text-[26rem]">
              {secs}
            </span>
            <span className="font-display text-[10vw] leading-none opacity-80 sm:text-[7rem]">
              .{pad3(ms)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
