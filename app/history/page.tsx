"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useSettings } from "../lib/settings";
import { fetchHistory, type HistoryEntry } from "../lib/scores";
import { JOKERS } from "../lib/jokers";
import JokerCard from "../components/JokerCard";
import LoginBanner from "../components/LoginBanner";

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
  const { language, t } = useSettings();
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

  const locale = language === "en" ? "en-US" : "es-ES";

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-cream/50 hover:text-cream text-xs transition-colors"
        >
          ← memorder
        </Link>
        <h1 className="font-display text-chrome text-sm tracking-widest sm:text-lg">
          {t("history.title")}
        </h1>
        <span aria-hidden className="w-16" />
      </header>

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
                <li
                  key={`${entry.seed}-${entry.createdAt}-${i}`}
                  className="card-base bg-card-face text-card-ink -skew-x-6 animate-row-in"
                >
                  <div className="flex skew-x-6 flex-wrap items-center gap-3 px-5 py-3.5 sm:gap-5">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-sans text-card-ink/50 text-[10px]">
                        {new Date(entry.createdAt).toLocaleDateString(locale)}
                      </span>
                      <span className="font-display text-chip-purple text-xs tracking-[0.14em]">
                        {entry.seed}
                      </span>
                    </div>

                    <div className="flex min-h-[26px] flex-1 items-center justify-center gap-1.5">
                      {entry.jokers.length === 0 ? (
                        <span className="font-sans text-card-ink/40 text-xs">
                          {t("history.jokersNone")}
                        </span>
                      ) : (
                        entry.jokers.map((id, idx) => (
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
                        <span className="tabular-nums">{entry.roundReached}</span>
                      </span>
                      <span className="font-display text-chip-gold text-sm tabular-nums">
                        {entry.score}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
