"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { setMasterVolume } from "./sounds";
import { translations, type Language, type TranslationKey } from "./i18n";
import type { Theme } from "./themes";
import {
  DEFAULT_DROP_CHANCE,
  ROLL_ORDER,
  setDropChance as applyDropChance,
  type Rarity,
} from "./jokers";

const STORAGE_KEY = "memorder:settings";
const THEMES: readonly Theme[] = ["original", "hacker", "cozy"];

/** Código que abre los ajustes de probabilidad de los comodines. */
const CHEAT_CODE = "FERCRY";

type Settings = {
  language: Language;
  volume: number;
  theme: Theme;
  /** Se ha introducido el código: quedan a la vista los porcentajes. */
  cheats: boolean;
  /** Probabilidad de cada rareza (0-1), ajustable con el código. */
  dropChance: Record<Rarity, number>;
};

const DEFAULT_SETTINGS: Settings = {
  language: "es",
  volume: 1,
  theme: "original",
  cheats: false,
  dropChance: { ...DEFAULT_DROP_CHANCE },
};

/** Sanea la tabla guardada: cada rareza, un número entre 0 y 1. */
function readDropChance(raw: unknown): Record<Rarity, number> {
  const source = (raw ?? {}) as Partial<Record<Rarity, unknown>>;
  const out = { ...DEFAULT_DROP_CHANCE };
  for (const rarity of ROLL_ORDER) {
    const value = source[rarity];
    if (typeof value === "number" && value >= 0 && value <= 1) {
      out[rarity] = value;
    }
  }
  return out;
}

/**
 * Store externo mínimo respaldado por localStorage. Se lee de forma síncrona
 * en el render vía useSyncExternalStore (React reconcilia solo server-snapshot
 * vs. client-snapshot tras hidratar, sin setState manual en un efecto) y se
 * escribe a través de updateSettings, que también notifica a los suscriptores.
 */
let currentSettings: Settings = DEFAULT_SETTINGS;
let initialized = false;
const listeners = new Set<() => void>();

function readFromStorage(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      language: parsed.language === "en" ? "en" : "es",
      volume:
        typeof parsed.volume === "number"
          ? Math.min(1, Math.max(0, parsed.volume))
          : 1,
      theme: THEMES.includes(parsed.theme) ? parsed.theme : "original",
      cheats: parsed.cheats === true,
      dropChance: readDropChance(parsed.dropChance),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Settings {
  if (!initialized) {
    initialized = true;
    currentSettings = readFromStorage();
  }
  return currentSettings;
}

function getServerSnapshot(): Settings {
  return DEFAULT_SETTINGS;
}

function updateSettings(patch: Partial<Settings>) {
  currentSettings = { ...currentSettings, ...patch };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
  listeners.forEach((listener) => listener());
}

type SettingsContextValue = Settings & {
  setLanguage: (language: Language) => void;
  setVolume: (volume: number) => void;
  setTheme: (theme: Theme) => void;
  /** Comprueba el código; devuelve si era correcto. */
  unlockCheats: (code: string) => boolean;
  setRarityChance: (rarity: Rarity, chance: number) => void;
  /** Devuelve las probabilidades a fábrica y vuelve a pedir el código. */
  resetCheats: () => void;
  t: (key: TranslationKey) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Sincroniza sistemas externos (atributo lang/data-theme del documento,
  // volumen del Web Audio) cada vez que cambia el estado, incluida la
  // primera carga real tras hidratar.
  useEffect(() => {
    document.documentElement.lang = settings.language;
    document.documentElement.dataset.theme = settings.theme;
    setMasterVolume(settings.volume);
    applyDropChance(settings.dropChance);
  }, [
    settings.language,
    settings.theme,
    settings.volume,
    settings.dropChance,
  ]);

  const setLanguage = (language: Language) => updateSettings({ language });
  const setVolume = (volume: number) => updateSettings({ volume });
  const setTheme = (theme: Theme) => updateSettings({ theme });

  const unlockCheats = (code: string) => {
    const ok = code.trim().toUpperCase() === CHEAT_CODE;
    if (ok) updateSettings({ cheats: true });
    return ok;
  };

  const setRarityChance = (rarity: Rarity, chance: number) =>
    updateSettings({
      dropChance: {
        ...currentSettings.dropChance,
        [rarity]: Math.min(1, Math.max(0, chance)),
      },
    });

  const resetCheats = () =>
    updateSettings({ dropChance: { ...DEFAULT_DROP_CHANCE }, cheats: false });

  const t = (key: TranslationKey) => translations[settings.language][key];

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setLanguage,
        setVolume,
        setTheme,
        unlockCheats,
        setRarityChance,
        resetCheats,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
