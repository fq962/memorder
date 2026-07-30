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
import {
  MAX_FIXED_WORDS,
  MIN_FIXED_WORDS,
  setFixedWordCount as applyFixedWords,
} from "../play/game";

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
  /** Palabras fijas por ronda, o null para la progresión normal. */
  fixedWords: number | null;
};

const DEFAULT_SETTINGS: Settings = {
  language: "es",
  volume: 1,
  theme: "original",
  cheats: false,
  dropChance: { ...DEFAULT_DROP_CHANCE },
  fixedWords: null,
};

/** Sanea las palabras fijas guardadas: null o un entero dentro del rango. */
function readFixedWords(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const value = Math.round(raw);
  if (value < MIN_FIXED_WORDS || value > MAX_FIXED_WORDS) return null;
  return value;
}

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
      fixedWords: readFixedWords(parsed.fixedWords),
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
  setFixedWords: (count: number | null) => void;
  /** Devuelve los ajustes de partida a fábrica y vuelve a pedir el código. */
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
    applyFixedWords(settings.fixedWords);
  }, [
    settings.language,
    settings.theme,
    settings.volume,
    settings.dropChance,
    settings.fixedWords,
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

  const setFixedWords = (count: number | null) =>
    updateSettings({
      fixedWords:
        count === null
          ? null
          : Math.min(MAX_FIXED_WORDS, Math.max(MIN_FIXED_WORDS, count)),
    });

  const resetCheats = () =>
    updateSettings({
      dropChance: { ...DEFAULT_DROP_CHANCE },
      fixedWords: null,
      cheats: false,
    });

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
        setFixedWords,
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
