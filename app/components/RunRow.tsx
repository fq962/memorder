"use client";

import { JOKERS } from "../lib/jokers";
import { useSettings } from "../lib/settings";
import type { HistoryEntry } from "../lib/scores";
import JokerCard from "./JokerCard";

/**
 * Una fila de partida (semilla, comodines, ronda, score), compartida entre
 * /history y /profile/[userId]: ambas listan el mismo tipo de dato, solo
 * cambia de quién y con qué filtro.
 */
export default function RunRow({ run }: { run: HistoryEntry }) {
  const { language, t } = useSettings();
  const locale = language === "en" ? "en-US" : "es-ES";

  return (
    <li className="card-base bg-card-face text-card-ink -skew-x-6 animate-row-in">
      <div className="flex skew-x-6 flex-wrap items-center gap-3 px-5 py-3.5 sm:gap-5">
        <div className="flex min-w-0 flex-col">
          <span className="font-sans text-card-ink/50 text-[10px]">
            {new Date(run.createdAt).toLocaleDateString(locale)}
          </span>
          <span className="font-display text-chip-purple text-xs tracking-[0.14em]">
            {run.seed}
          </span>
          {run.seedIsCustom && (
            <span className="font-display text-card-ink/45 mt-0.5 text-[9px] tracking-widest">
              {t("history.customBadge")}
            </span>
          )}
        </div>

        <div className="flex min-h-[26px] flex-1 items-center justify-center gap-1.5">
          {run.jokers.length === 0 ? (
            <span className="font-sans text-card-ink/40 text-xs">
              {t("history.jokersNone")}
            </span>
          ) : (
            run.jokers.map((id, idx) => (
              <JokerCard
                key={idx}
                joker={JOKERS[id]}
                width={22}
                className="rounded-[2px]"
              />
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="font-display text-[11px]">
            {t("history.round")}{" "}
            <span className="tabular-nums">{run.roundReached}</span>
          </span>
          <span className="font-display text-chip-gold text-sm tabular-nums">
            {run.score}
          </span>
        </div>
      </div>
    </li>
  );
}
