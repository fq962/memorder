"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSettings } from "../../lib/settings";
import { fetchUserProfile, type UserProfile } from "../../lib/scores";
import RunRow from "../../components/RunRow";

/**
 * Igual que el ranking y el historial: "ready" con listas vacías (todavía
 * no jugó ninguna run de ese tipo) y "error" (no se pudo consultar) se
 * distinguen para no confundir uno con otro.
 */
type ProfileState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; profile: UserProfile };

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  // El ranking ya sabe el nombre: se pasa por query para no mostrar "…"
  // mientras carga el perfil completo.
  const nameHint = searchParams.get("name");
  const { t } = useSettings();
  const [state, setState] = useState<ProfileState>({ status: "loading" });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchUserProfile(userId).then((profile) => {
      if (cancelled) return;
      setState(
        profile === null ? { status: "error" } : { status: "ready", profile },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName =
    state.status === "ready" ? state.profile.displayName : (nameHint ?? "…");

  return (
    <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
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
      <h1 className="font-display text-chrome mt-8 truncate text-center text-lg tracking-widest sm:text-xl">
        {displayName}
      </h1>

      {state.status === "loading" && (
        <p className="font-display text-cream/40 animate-pulse text-center text-[10px] tracking-widest">
          {t("userProfile.loading")}
        </p>
      )}
      {state.status === "error" && (
        <p className="font-sans text-chip-red/90 text-center text-sm">
          {t("userProfile.error")}
        </p>
      )}

      {state.status === "ready" && (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-display text-chip-gold text-xs tracking-widest">
                {t("userProfile.officialSection")}
              </h2>
              <p className="font-sans text-cream/45 text-[11px]">
                {t("userProfile.officialHint")}
              </p>
            </div>
            {state.profile.official.length === 0 ? (
              <p className="font-sans text-cream/55 text-sm">
                {t("userProfile.empty")}
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {state.profile.official.map((run, i) => (
                  <RunRow key={`${run.seed}-${run.createdAt}-${i}`} run={run} />
                ))}
              </ol>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-display text-chip-purple text-xs tracking-widest">
                {t("userProfile.customSection")}
              </h2>
              <p className="font-sans text-cream/45 text-[11px]">
                {t("userProfile.customHint")}
              </p>
            </div>
            {state.profile.custom.length === 0 ? (
              <p className="font-sans text-cream/55 text-sm">
                {t("userProfile.empty")}
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {state.profile.custom.map((run, i) => (
                  <RunRow key={`${run.seed}-${run.createdAt}-${i}`} run={run} />
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </main>
  );
}
