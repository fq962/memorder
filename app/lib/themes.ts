// Temas visuales: cada uno reasigna los tokens de color de globals.css vía
// data-theme en <html>. Los swatches son solo para previsualizar el tema en
// el menú de opciones, no afectan el theming real.
//
// Hay dos orígenes:
// - De fábrica (este archivo): original/hacker/cozy, con su CSS a mano en
//   globals.css. Siempre están, no dependen de nada externo.
// - De base de datos (tabla `themes` en Supabase, ver
//   supabase/migrations/0004_themes_table.sql): se traen en el build
//   (app/lib/themes-server.ts) y su CSS se genera con app/lib/theme-engine.ts
//   a partir de sus 10 colores núcleo. Agregar uno nuevo es un insert en esa
//   tabla + un redeploy — sin tocar código ni CSS. Para armar el insert sin
//   pelearse con SQL a mano, ver la ruta oculta /theme-lab.
import type { ThemeRecord } from "./theme-engine";

/** El valor que viaja en data-theme y se guarda en ajustes: cualquier slug. */
export type Theme = string;

export type ThemeSwatchOption = {
  code: Theme;
  label: string;
  swatch: [felt: string, a: string, b: string, c: string];
};

export const BUILTIN_THEME_OPTIONS: ThemeSwatchOption[] = [
  {
    code: "original",
    label: "Original",
    swatch: ["#0e1a24", "#ff4d5e", "#ffcb2b", "#3aa0ff"],
  },
  {
    code: "hacker",
    label: "Hacker",
    swatch: ["#050b06", "#8fd9a0", "#d4e89c", "#7ab8c4"],
  },
  {
    code: "cozy",
    label: "Pastel",
    swatch: ["#2b2438", "#ffd6a5", "#b9fbc0", "#a081c2"],
  },
];

/** Convierte un tema de base de datos en la opción que pinta el selector. */
export function toThemeOption(theme: ThemeRecord): ThemeSwatchOption {
  return {
    code: theme.id,
    label: theme.label,
    swatch: [theme.felt, theme.chipRed, theme.chipGold, theme.chipBlue],
  };
}
