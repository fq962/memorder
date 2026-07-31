"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useSettings } from "../lib/settings";
import JokerCard, { JokerCardBack } from "./JokerCard";
import {
  CARD_ASPECT,
  JOKERS,
  RARITY_CLASS,
  RARITY_LABEL_KEY,
  type JokerId,
} from "../lib/jokers";

/** Ancho de la carta en la pantalla de hallazgo. */
const CARD_WIDTH = 232;
const CARD_HEIGHT = Math.round(CARD_WIDTH / CARD_ASPECT);

/** Segundos que dura el giro: el texto de debajo entra justo al aterrizar. */
const LANDED_S = 1.05;

/**
 * Pantalla de "has encontrado un comodín": la carta entra por el reverso,
 * gira sobre sí misma y queda de frente, con el nombre arriba y lo que hace
 * debajo. NO se cierra sola: la partida espera a que se pulse CONTINUAR, para
 * dar tiempo a leer lo que hace el comodín.
 */
export default function JokerReveal({
  joker: jokerId,
  onDismiss,
}: {
  joker: JokerId;
  onDismiss: () => void;
}) {
  const { t } = useSettings();
  const joker = JOKERS[jokerId];

  // Enter / Espacio / Escape también continúan, para no romper el ritmo de
  // quien juega a teclado.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Escape") return;
      e.preventDefault();
      onDismiss();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={t("joker.found")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/80 px-6 py-10 text-center backdrop-blur-sm"
    >
      <motion.p
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="font-display text-chip-gold text-[10px] tracking-[0.3em]"
      >
        {t("joker.found")}
      </motion.p>

      {/* Nombre del comodín, encima de la carta. */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 16 }}
        className="font-display text-chrome text-3xl sm:text-4xl"
      >
        {t(joker.nameKey)}
      </motion.h2>

      {/* Rareza: justifica el color de la lámina (morado = épica). */}
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className={`card-base bg-card-ink/85 text-cream font-display -skew-x-6 px-3 py-1 text-[9px] tracking-[0.25em] ring-2 ring-[var(--holo-glow)] shadow-[0_0_18px_var(--holo-glow)] ${RARITY_CLASS[joker.rarity]}`}
      >
        <span className="block skew-x-6">
          {t(RARITY_LABEL_KEY[joker.rarity])}
        </span>
      </motion.span>

      {/* La carta: reverso y cara son las dos mitades del mismo giro 3D. La
          clase de rareza va aquí para que el halo tome también su color. */}
      <div
        className={`relative [perspective:1400px] ${RARITY_CLASS[joker.rarity]}`}
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {/* Halo que se enciende detrás conforme la carta deja de girar. */}
        <span
          aria-hidden
          className="animate-joker-halo pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,var(--holo-glow),var(--holo-b)_45%,transparent_70%)] blur-xl"
        />

        {/* Balanceo continuo: mueve la carta en 3D para que el holograma
            cambie de ángulo, como cuando giras una carta en la mano. */}
        <div className="animate-joker-tilt h-full w-full [transform-style:preserve-3d]">
          <div className="animate-joker-flip relative h-full w-full [transform-style:preserve-3d]">
            <JokerCardBack
              joker={joker}
              width={CARD_WIDTH}
              className="absolute inset-0 [backface-visibility:hidden] drop-shadow-[0_16px_28px_rgba(0,0,0,0.65)]"
            />
            {/* La cara lleva la sombra y el halo de rareza aquí fuera: dentro
                del recorte del holograma se perderían. */}
            <JokerCard
              joker={joker}
              width={CARD_WIDTH}
              alt={t(joker.nameKey)}
              className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] [filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.65))_drop-shadow(0_0_20px_var(--holo-glow))]"
            >
              {/* Barrido de brillo al aterrizar. */}
              <span
                aria-hidden
                className="animate-joker-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />
            </JokerCard>
          </div>
        </div>
      </div>

      {/* Qué hace el comodín, debajo de la carta. */}
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: LANDED_S, duration: 0.35, ease: "easeOut" }}
        className="card-base bg-card-face text-card-ink max-w-sm px-6 py-4 font-sans text-sm"
      >
        {t(joker.descriptionKey)}
      </motion.p>

      {/* Nada de cierre automático: la partida sigue parada hasta aquí. */}
      <motion.button
        type="button"
        autoFocus
        onClick={onDismiss}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: LANDED_S + 0.35, duration: 0.35 }}
        className="card-base bg-chip-green text-card-ink -skew-x-6 px-8 py-3 transition-transform duration-150 hover:scale-110 active:scale-95"
      >
        <span className="font-display block skew-x-6 text-sm">
          {t("joker.continue")}
        </span>
      </motion.button>
    </motion.div>
  );
}
