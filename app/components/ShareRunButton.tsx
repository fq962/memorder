"use client";

import { useState } from "react";
import { Loader2Icon, Share2Icon } from "lucide-react";
import { useSettings } from "../lib/settings";
import { drawShareCard } from "../lib/shareCard";
import type { JokerId } from "../lib/jokers";

type Status = "idle" | "generating" | "shared" | "downloaded" | "error";

/**
 * Genera la tarjeta de resultado (ver app/lib/shareCard.ts) y la comparte:
 * Web Share API con archivo si el navegador lo soporta (móvil, incluye
 * WhatsApp en el picker nativo), o descarga del PNG como respaldo (típico en
 * escritorio, donde no se puede adjuntar una imagen por wa.me).
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
  const { t } = useSettings();
  const [status, setStatus] = useState<Status>("idle");

  async function handleShare() {
    setStatus("generating");
    try {
      const canvas = document.createElement("canvas");
      await drawShareCard(canvas, {
        score,
        round,
        wordsCorrect,
        seed,
        jokers,
        siteUrl: window.location.origin,
        t,
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("no-blob");

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

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
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
    </div>
  );
}
