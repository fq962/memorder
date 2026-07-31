"use client";

import { LogInIcon } from "lucide-react";
import { useSettings } from "../lib/settings";
import type { TranslationKey } from "../lib/i18n";

/**
 * Invitación a loguearse, reusada en el Game Over (para no perder la
 * puntuación recién hecha) y en /history (para poder ver el historial).
 */
export default function LoginBanner({
  message,
  cta,
  onLogin,
}: {
  message: TranslationKey;
  cta: TranslationKey;
  onLogin: () => void;
}) {
  const { t } = useSettings();

  return (
    <div className="card-base bg-card-face/95 text-card-ink animate-row-in flex w-full max-w-sm flex-col items-center gap-3 px-6 py-5 text-center">
      <p className="font-sans text-sm">{t(message)}</p>
      <button
        type="button"
        onClick={onLogin}
        className="card-base bg-chip-blue text-cream -skew-x-6 px-5 py-2.5 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="font-display flex skew-x-6 items-center gap-2 text-xs">
          <LogInIcon className="h-4 w-4" />
          {t(cta)}
        </span>
      </button>
    </div>
  );
}
