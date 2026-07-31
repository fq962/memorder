"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Profile = {
  username: string | null;
  usernameChangedAt: string | null;
};

/**
 * Los códigos que puede devolver la función set_username en Supabase
 * (RPC, ver la migración SQL). El cliente los usa para elegir el mensaje.
 */
export type SetUsernameError =
  | "invalid_username"
  | "username_taken"
  | "cooldown_active"
  | "not_authenticated"
  | "not_configured"
  | "unknown";

type SetUsernameResult = { ok: true } | { ok: false; code: SetUsernameError };

type ProfileContextValue = {
  profile: Profile | null;
  setUsername: (name: string) => Promise<SetUsernameResult>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Carga y expone el perfil (username + cuándo se cambió por última vez) del
 * usuario logueado. Depende de AuthProvider: debe montarse dentro de él.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Solo guarda lo que se llegó a traer de Supabase; nunca se "limpia" a
  // mano. El perfil expuesto se deriva de `user` más abajo, así que al
  // desloguearse desaparece solo, sin un setState síncrono en el efecto.
  const [fetched, setFetched] = useState<Profile | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client || !user) return;

    let cancelled = false;
    client
      .from("profiles")
      .select("display_name, username_changed_at")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        setFetched(
          data
            ? {
                username: data.display_name,
                usernameChangedAt: data.username_changed_at,
              }
            : null,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const profile = user ? fetched : null;

  const setUsername = async (name: string): Promise<SetUsernameResult> => {
    if (!supabase) return { ok: false, code: "not_configured" };
    const { data, error } = await supabase.rpc("set_username", {
      new_username: name,
    });
    if (error) {
      const code = error.message as SetUsernameError;
      const known: SetUsernameError[] = [
        "invalid_username",
        "username_taken",
        "cooldown_active",
        "not_authenticated",
      ];
      return { ok: false, code: known.includes(code) ? code : "unknown" };
    }
    const row = data as { display_name: string; username_changed_at: string };
    setFetched({
      username: row.display_name,
      usernameChangedAt: row.username_changed_at,
    });
    return { ok: true };
  };

  return (
    <ProfileContext.Provider value={{ profile, setUsername }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return ctx;
}
