"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";
import { fetchHistory, type HistoryEntry } from "../lib/scores";
import LoginBanner from "../components/LoginBanner";
import RunRow from "../components/RunRow";

/**
 * Los tres estados del historial, igual que el ranking del home: "ready" con
 * lista vacía (nunca jugó logueado) y "error" (no se pudo consultar) se
 * distinguen para no confundir uno con otro.
 */
type HistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; entries: HistoryEntry[] };

export default function HistoryPage() {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useSettings();
  const [state, setState] = useState<HistoryState>({ status: "loading" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchHistory(user.id).then((entries) => {
      if (cancelled) return;
      setState(
        entries === null ? { status: "error" } : { status: "ready", entries },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* El título va en su propia fila, no compartiendo la de "Ajustes":
          ese botón es fijo arriba a la derecha en TODAS las pantallas que
          no son de juego, y un título centrado en la misma fila termina
          debajo suyo en mobile en vez de fallar solo en desktop. */}
      <header className="flex items-center">
        <Link
          href="/"
          className="font-display text-cream/50 hover:text-cream text-xs transition-colors"
        >
          ← memorder
        </Link>
      </header>
      {/* mt-8: "Ajustes" es fixed top-4 right-4 en TODas las anchuras (no
          solo mobile), así que el título necesita el mismo despeje siempre,
          no solo por debajo de sm. */}
      <h1 className="font-display text-chrome mt-8 text-center text-sm tracking-widest sm:text-lg">
        {t("history.title")}
      </h1>

      {!user ? (
        <div className="flex flex-1 items-center justify-center">
          <LoginBanner
            message="history.loginCta"
            cta="auth.signIn"
            onLogin={() => void signInWithGoogle()}
          />
        </div>
      ) : (
        <>
          {state.status === "loading" && (
            <p className="font-display text-cream/40 animate-pulse text-center text-[10px] tracking-widest">
              {t("history.loading")}
            </p>
          )}
          {state.status === "error" && (
            <p className="font-sans text-chip-red/90 text-center text-sm">
              {t("history.error")}
            </p>
          )}
          {state.status === "ready" && state.entries.length === 0 && (
            <p className="font-sans text-cream/55 text-center text-sm">
              {t("history.empty")}
            </p>
          )}
          {state.status === "ready" && state.entries.length > 0 && (
            <ol className="flex flex-col gap-3">
              {state.entries.map((entry, i) => (
                <RunRow key={`${entry.seed}-${entry.createdAt}-${i}`} run={entry} />
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
