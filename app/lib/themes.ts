// Temas visuales: cada uno reasigna los tokens de color de globals.css vía
// data-theme en <html>. Los swatches son solo para previsualizar el tema en
// el menú de opciones, no afectan el theming real.
export type Theme = "original" | "hacker" | "cozy";

export const THEME_OPTIONS: {
  code: Theme;
  label: string;
  swatch: [felt: string, a: string, b: string, c: string];
}[] = [
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
