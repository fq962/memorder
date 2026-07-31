"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Sin supabase configurado nunca hay nada que cargar: arranca en false
  // (supabase es estático a nivel de módulo, no cambia entre renders).
  const [loading, setLoading] = useState(() => supabase !== null);

  useEffect(() => {
    // Se captura en una const local: TS no retiene el narrowing del `if
    // (!supabase)` de más arriba dentro de los closures async de abajo.
    const client = supabase;
    if (!client) return;

    // Si venimos del redirect de Google, la URL trae ?code=...: se
    // intercambia por la sesión y se limpia el query param.
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const exchange = code
      ? client.auth.exchangeCodeForSession(code).finally(() => {
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        })
      : Promise.resolve();

    exchange.finally(() => {
      client.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      });
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      // Vuelve a la MISMA página desde la que se pidió el login, no siempre
      // al home: el Game Over de /play depende de esto para poder guardar la
      // partida apenas haya sesión (ver PendingRunSync).
      options: { redirectTo: window.location.href },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
