"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { ICONS } from "../lib/icons";
import { LANGUAGE_OPTIONS } from "../lib/i18n";
import { useSettings } from "../lib/settings";
import { playTick } from "../lib/sounds";
import { THEME_OPTIONS } from "../lib/themes";
import { GlobeIcon, PaletteIcon, SettingsIcon, VolumeIcon, XIcon } from "lucide-react";

/**
 * Botón de engranaje fijo en la esquina + panel modal con volumen e idioma.
 * Vive en el layout raíz, así que está disponible en cualquier pantalla.
 */
export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const { language, volume, theme, setLanguage, setVolume, setTheme, t } =
    useSettings();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card-base bg-chip-red text-cream fixed top-4 right-4 z-40 -skew-x-6 px-5 py-3 transition-transform hover:scale-110 hover:brightness-110 active:scale-95"
      >
        <span className="font-display flex skew-x-6 items-center gap-2.5 text-sm">
          {/* <Image src={ICONS.settings} alt="" width={28} height={27} /> */}
          <SettingsIcon className="w-6 h-6 text-white" />
          {t("settings.open")}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="card-base bg-card-face text-card-ink relative w-full max-w-sm px-7 py-7"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("settings.close")}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-lg opacity-60 transition-opacity hover:opacity-100"
              >
                <XIcon className="size-4 text-card-ink/60" />
              </button>

              <h2 className="font-display flex items-center justify-center gap-2 text-center text-sm tracking-widest">
                {t("settings.title")}
              </h2>

              <div className="mt-8 flex flex-col gap-3">
                <label className="font-display flex items-center justify-between text-[10px] tracking-wide">
                  <span className="flex items-center gap-2"><VolumeIcon className="size-4 text-card-ink/60" /> {t("settings.volume")}</span>
                  <span className="tabular-nums text-card-ink/60">
                    {Math.round(volume * 100)}%
                  </span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  className="accent-chip-gold h-2 w-full cursor-pointer"
                />
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <p className="font-display text-[10px] tracking-wide flex items-center gap-2">
                  <PaletteIcon className="size-4 text-card-ink/60" /> {t("settings.theme")}
                </p>
                <div className="flex gap-3">
                  {THEME_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setTheme(option.code);
                        playTick(560 + THEME_OPTIONS.indexOf(option) * 80);
                      }}
                      className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-2 py-2.5 transition-transform hover:scale-105 active:scale-95 ${
                        theme === option.code
                          ? "border-chip-gold bg-chip-gold/15"
                          : "border-card-ink/20 bg-transparent"
                      }`}
                    >
                      <span
                        className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-full"
                        style={{ width: 18, height: 18 }}
                      >
                        {option.swatch.map((color, i) => (
                          <span
                            key={i}
                            style={{ backgroundColor: color }}
                            className="h-full w-full"
                          />
                        ))}
                      </span>
                      <span className="font-display text-card-ink text-[9px]">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <p className="font-display text-[10px] tracking-wide flex items-center gap-2">
                  <GlobeIcon className="size-4 text-card-ink/60" /> {t("settings.language")}
                </p>
                <div className="flex gap-3">
                  {LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setLanguage(option.code);
                        playTick(option.code === "en" ? 720 : 640);
                      }}
                      className={`font-display flex-1 -skew-x-6 px-4 py-2.5 text-xs transition-transform hover:scale-105 active:scale-95 ${
                        language === option.code
                          ? "bg-chip-gold text-card-ink"
                          : "text-card-ink/60 border-card-ink/20 border bg-transparent"
                      }`}
                    >
                      <span className="block skew-x-6">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
