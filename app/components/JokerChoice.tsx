"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useSettings } from "../lib/settings";
import JokerCard from "./JokerCard";
import { JOKERS, RARITY_CLASS, RARITY_LABEL_KEY, type JokerId } from "../lib/jokers";

/** Ancho de cada carta: más chica que en JokerReveal, van dos a la vez. */
const CARD_WIDTH = 168;

/**
 * Pantalla de "elige un comodín": salen dos cartas ya boca arriba (hace
 * falta ver ambas para decidir) y tocar una la elige al momento — no hay
 * botón CONTINUAR aparte, elegir es continuar. Igual que JokerReveal, pausa
 * la comprobación mientras está en pantalla.
 */
export default function JokerChoice({
  jokers,
  onChoose,
}: {
  jokers: [JokerId, JokerId];
  onChoose: (id: JokerId) => void;
}) {
  const { t } = useSettings();

  // 1 / 2 eligen directo, para quien juega a teclado.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "1") onChoose(jokers[0]);
      else if (e.key === "2") onChoose(jokers[1]);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jokers, onChoose]);

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-label={t("joker.chooseOne")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/80 px-6 py-10 text-center backdrop-blur-sm"
    >
      <motion.p
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="font-display text-chip-gold text-[10px] tracking-[0.3em]"
      >
        {t("joker.chooseOne")}
      </motion.p>

      <div className="flex flex-wrap items-start justify-center gap-6">
        {jokers.map((id, i) => {
          const joker = JOKERS[id];
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onChoose(id)}
              initial={{ opacity: 0, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.15 + i * 0.12,
                type: "spring",
                stiffness: 260,
                damping: 18,
              }}
              className="group flex w-[190px] flex-col items-center gap-3 transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <JokerCard
                joker={joker}
                width={CARD_WIDTH}
                alt={t(joker.nameKey)}
                className={`[filter:drop-shadow(0_16px_28px_rgba(0,0,0,0.65))_drop-shadow(0_0_16px_var(--holo-glow))]`}
              />
              <span className="font-display text-chrome text-base">
                {t(joker.nameKey)}
              </span>
              <span
                className={`card-base bg-card-ink/85 text-cream font-display -skew-x-6 px-2.5 py-1 text-[8px] tracking-[0.25em] ring-2 ring-[var(--holo-glow)] ${RARITY_CLASS[joker.rarity]}`}
              >
                <span className="block skew-x-6">
                  {t(RARITY_LABEL_KEY[joker.rarity])}
                </span>
              </span>
              <span className="card-base bg-card-face text-card-ink px-4 py-3 font-sans text-xs">
                {t(joker.descriptionKey)}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
