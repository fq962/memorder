"use client";

import Image from "next/image";
import { LogInIcon, LogOutIcon, UserIcon } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { useSettings } from "../lib/settings";

/**
 * Login/logout con Google, arriba a la izquierda (simétrico al engranaje de
 * ajustes). Vive solo en el home: la identidad es un concepto de esa
 * pantalla, no de la partida en curso.
 */
export default function AuthButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { t } = useSettings();

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

  if (loading) return null;

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      "";

    return (
      <button
        type="button"
        onClick={() => void signOut()}
        title={t("auth.signOut")}
        className="card-base bg-card-face text-card-ink fixed top-4 left-4 z-40 flex -skew-x-6 items-center gap-2.5 px-4 py-2.5 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="flex skew-x-6 items-center gap-2.5">
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
          <span className="font-display max-w-[8rem] truncate text-xs">
            {name}
          </span>
          <LogOutIcon className="h-4 w-4 opacity-60" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void signInWithGoogle()}
      className="card-base bg-chip-blue text-cream fixed top-4 left-4 z-40 -skew-x-6 px-5 py-3 transition-transform hover:scale-110 hover:brightness-110 active:scale-95"
    >
      <span className="font-display flex skew-x-6 items-center gap-2.5 text-sm">
        <LogInIcon className="h-5 w-5" />
        {t("auth.signIn")}
      </span>
    </button>
  );
}
