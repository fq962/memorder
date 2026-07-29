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

const STORAGE_KEY = "memorder:settings";

type Settings = {
  language: Language;
  volume: number;
};

const DEFAULT_SETTINGS: Settings = { language: "es", volume: 1 };

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
  t: (key: TranslationKey) => string;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Sincroniza sistemas externos (atributo lang del documento, volumen del
  // Web Audio) cada vez que cambia el estado, incluida la primera carga real
  // tras hidratar.
  useEffect(() => {
    document.documentElement.lang = settings.language;
    setMasterVolume(settings.volume);
  }, [settings.language, settings.volume]);

  const setLanguage = (language: Language) => updateSettings({ language });
  const setVolume = (volume: number) => updateSettings({ volume });
  const t = (key: TranslationKey) => translations[settings.language][key];

  return (
    <SettingsContext.Provider value={{ ...settings, setLanguage, setVolume, t }}>
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
