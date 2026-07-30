"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  CheckIcon,
  Loader2Icon,
  LogInIcon,
  LogOutIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { useProfile, type SetUsernameError } from "../lib/profile";
import { supabase } from "../lib/supabase";
import { useSettings } from "../lib/settings";
import type { TranslationKey } from "../lib/i18n";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
/** Referencial para la UI: la regla real la aplica la función set_username. */
const COOLDOWN_MONTHS = 3;

function addMonths(iso: string, months: number): Date {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d;
}

const ERROR_KEY: Record<SetUsernameError, TranslationKey> = {
  invalid_username: "profile.usernameInvalid",
  username_taken: "profile.usernameTaken",
  cooldown_active: "profile.cooldownActive",
  not_authenticated: "profile.genericError",
  not_configured: "profile.genericError",
  unknown: "profile.genericError",
};

/**
 * Login/logout con Google, arriba a la izquierda (simétrico al engranaje de
 * ajustes). Vive solo en el home: la identidad es un concepto de esa
 * pantalla, no de la partida en curso. Logueado, abre un panel para editar
 * el username (con cooldown de 3 meses) y cerrar sesión.
 */
export default function AuthButton() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { profile, setUsername } = useProfile();
  const { language, t } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorCode, setErrorCode] = useState<SetUsernameError | null>(null);
  // "Ahora" se lee una sola vez, al abrir el panel (evento, no render): leer
  // el reloj durante el render rompe la pureza que exige React.
  const [now, setNow] = useState(() => Date.now());

  // Al abrir el panel, el campo arranca con el nombre actual y sin mensajes
  // de un intento anterior.
  function openProfile() {
    setDraft(profile?.username ?? "");
    setStatus("idle");
    setErrorCode(null);
    setNow(Date.now());
    setOpen(true);
  }

  if (!supabase) {
    return (
      <button
        type="button"
        disabled
        title={t("auth.notConfigured")}
        className="card-base bg-card-face text-card-ink/40 fixed top-4 left-4 z-40 -skew-x-6 px-5 py-3 opacity-60"
      >
        <span className="font-display flex skew-x-6 items-center gap-2.5 text-sm">
          <UserIcon className="h-5 w-5" />
        </span>
      </button>
    );
  }

  if (authLoading) return null;

  const locale = language === "en" ? "en-US" : "es-ES";
  const nextChangeDate = profile?.usernameChangedAt
    ? addMonths(profile.usernameChangedAt, COOLDOWN_MONTHS)
    : null;
  const onCooldown = !!nextChangeDate && nextChangeDate.getTime() > now;
  const cooldownPreviewDate = new Date(
    now + COOLDOWN_MONTHS * 30 * 24 * 60 * 60 * 1000,
  );

  async function handleSave() {
    if (!USERNAME_PATTERN.test(draft)) {
      setStatus("error");
      setErrorCode("invalid_username");
      return;
    }
    setStatus("saving");
    const result = await setUsername(draft);
    if (result.ok) {
      setStatus("saved");
      setErrorCode(null);
    } else {
      setStatus("error");
      setErrorCode(result.code);
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName =
    profile?.username ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "";

  return (
    <>
      <button
        type="button"
        onClick={() => (user ? openProfile() : void signInWithGoogle())}
        className="card-base bg-card-face text-card-ink fixed top-4 left-4 z-40 flex -skew-x-6 items-center gap-2.5 px-4 py-2.5 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="font-display flex skew-x-6 items-center gap-2.5 text-sm">
          {user ? (
            <>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={26}
                  height={26}
                  className="rounded-full"
                />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
              <span className="max-w-[8rem] truncate text-xs">
                {displayName}
              </span>
            </>
          ) : (
            <>
              <LogInIcon className="h-5 w-5" />
              {t("auth.signIn")}
            </>
          )}
        </span>
      </button>

      <AnimatePresence>
        {open && user && (
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

              <h2 className="font-display text-center text-sm tracking-widest">
                {t("profile.title")}
              </h2>

              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="mx-auto mt-5 rounded-full"
                />
              )}

              <div className="mt-6 flex flex-col gap-2">
                <label className="font-display text-[10px] tracking-wide">
                  {t("profile.username")}
                </label>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setStatus("idle");
                    setErrorCode(null);
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") void handleSave();
                  }}
                  disabled={onCooldown || status === "saving"}
                  placeholder={t("profile.usernamePlaceholder")}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-display border-card-ink/25 text-card-ink placeholder:text-card-ink/35 rounded-md border bg-transparent px-3 py-2 text-xs outline-none focus:border-chip-gold disabled:opacity-50"
                />

                {onCooldown && nextChangeDate ? (
                  <p className="font-sans text-card-ink/60 text-[11px] leading-snug">
                    {t("profile.cooldownActive")}{" "}
                    <span className="font-bold">
                      {nextChangeDate.toLocaleDateString(locale)}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="font-sans text-card-ink/45 text-[10px] leading-snug">
                    {t("profile.cooldownNotice")}{" "}
                    {cooldownPreviewDate.toLocaleDateString(locale)}.
                  </p>
                )}

                {!onCooldown && (
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={
                      status === "saving" ||
                      draft === (profile?.username ?? "") ||
                      draft.length === 0
                    }
                    className="font-display bg-chip-gold text-card-ink -skew-x-6 mt-1 self-start px-4 py-2 text-[10px] transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  >
                    <span className="flex skew-x-6 items-center gap-1.5">
                      {status === "saving" && (
                        <Loader2Icon className="h-3 w-3 animate-spin" />
                      )}
                      {status === "saved" && <CheckIcon className="h-3 w-3" />}
                      {status === "saving"
                        ? t("profile.saving")
                        : t("profile.save")}
                    </span>
                  </button>
                )}

                {status === "error" && errorCode && (
                  <p className="font-sans text-chip-red text-[11px]">
                    {t(ERROR_KEY[errorCode])}
                  </p>
                )}

                {status === "saved" && nextChangeDate && (
                  <p className="font-sans text-chip-green text-[11px]">
                    {t("profile.savedUntil")}{" "}
                    <span className="font-bold">
                      {nextChangeDate.toLocaleDateString(locale)}
                    </span>
                    .
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="font-display border-card-ink/15 text-card-ink/60 hover:text-card-ink mt-7 flex items-center gap-2 border-t pt-5 text-[10px] tracking-wide transition-colors"
              >
                <LogOutIcon className="h-4 w-4" />
                {t("auth.signOut")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
