"use client";

import { useState } from "react";
import { Loader2Icon, Share2Icon } from "lucide-react";
import { useSettings } from "../lib/settings";
import { buildShareCardUrl } from "../lib/shareCard";
import type { JokerId } from "../lib/jokers";

type Status = "idle" | "generating" | "shared" | "downloaded" | "error";

/**
 * Pide la tarjeta de resultado a /share-card (ver app/lib/shareCard.ts para
 * cómo se arma la URL) y la comparte: Web Share API con archivo si el
 * navegador lo soporta (móvil, incluye WhatsApp en el picker nativo), o
 * descarga del PNG como respaldo (típico en escritorio, donde no se puede
 * adjuntar una imagen por wa.me).
 */
export default function ShareRunButton({
  score,
  round,
  wordsCorrect,
  seed,
  jokers,
}: {
  score: number;
  round: number;
  wordsCorrect: number;
  seed: string;
  jokers: JokerId[];
}) {
  const { t, language } = useSettings();
  const [status, setStatus] = useState<Status>("idle");

  async function handleShare() {
    setStatus("generating");
    try {
      const url = buildShareCardUrl({
        score,
        round,
        wordsCorrect,
        seed,
        jokers,
        language,
      });

      const response = await fetch(url);
      if (!response.ok) throw new Error(`share-card: ${response.status}`);
      const blob = await response.blob();

      const file = new File([blob], `memorder-${seed}.png`, {
        type: "image/png",
      });
      const text = t("share.inviteText")
        .replace("{round}", String(round))
        .replace("{score}", String(score));

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "MEMORDER", text });
        setStatus("shared");
        return;
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setStatus("downloaded");
    } catch (err) {
      // El usuario cerró el share sheet sin elegir nada: no es un error.
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={status === "generating"}
        className="card-base bg-chip-pink text-cream -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
      >
        <span className="font-display flex skew-x-6 items-center gap-2 text-sm">
          {status === "generating" ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <Share2Icon className="h-4 w-4" />
          )}
          {status === "generating"
            ? t("play.gameoverShareGenerating")
            : t("play.gameoverShare")}
        </span>
      </button>
      {status === "downloaded" && (
        <p className="font-sans text-cream/60 max-w-[220px] text-center text-[10px] leading-snug">
          {t("play.gameoverShareFallbackHint")}
        </p>
      )}
      {status === "error" && (
        <p className="font-sans text-chip-red/80 max-w-[220px] text-center text-[10px] leading-snug">
          {t("play.gameoverShareError")}
        </p>
      )}
    </div>
  );
}
