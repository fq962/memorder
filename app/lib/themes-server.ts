// Trae los temas "de base de datos" en el servidor — solo lo importa
// app/layout.tsx (Server Component), nunca un componente cliente.
//
// El fetch pide cache: "force-cache": en esta versión de Next (sin
// cacheComponents) eso es justo lo que hace falta para que se resuelva UNA
// vez en el build y se reuse en cada request hasta el próximo deploy. Por
// eso "agregar un tema" es insertar la fila en la tabla `themes` y hacer un
// redeploy: no hay nada más que tocar.
//
// Si Supabase no está configurado, la tabla todavía no existe, o el fetch
// falla por lo que sea, se cae a un tema embebido (hoy: spiderman) para que
// el build nunca se rompa por esto — mismo criterio que el resto de la app
// (ver app/lib/supabase.ts).
import { buildThemesCss, type ThemeRecord } from "./theme-engine";

const FALLBACK_THEMES: ThemeRecord[] = [
  {
    id: "spiderman",
    label: "Spider-Man",
    felt: "#0c0f1a",
    cream: "#f2ece0",
    chipRed: "#e0262f",
    chipBlue: "#2f6fe0",
    chipGold: "#ffb100",
    chipGreen: "#39e07a",
    chipPurple: "#7c5cff",
    chipPink: "#ff4fa3",
    cardFace: "#f2e9da",
    cardInk: "#12182b",
    sortOrder: 10,
  },
];

/** Fila cruda tal como la devuelve PostgREST (columnas en snake_case). */
type ThemeRow = {
  id: string;
  label: string;
  felt: string;
  cream: string;
  chip_red: string;
  chip_blue: string;
  chip_gold: string;
  chip_green: string;
  chip_purple: string;
  chip_pink: string;
  card_face: string;
  card_ink: string;
  sort_order: number | null;
};

function rowToRecord(row: ThemeRow): ThemeRecord {
  return {
    id: row.id,
    label: row.label,
    felt: row.felt,
    cream: row.cream,
    chipRed: row.chip_red,
    chipBlue: row.chip_blue,
    chipGold: row.chip_gold,
    chipGreen: row.chip_green,
    chipPurple: row.chip_purple,
    chipPink: row.chip_pink,
    cardFace: row.card_face,
    cardInk: row.card_ink,
    sortOrder: row.sort_order ?? 0,
  };
}

/**
 * Trae los temas extra desde la tabla `themes` de Supabase, vía REST directo
 * (no supabase-js): así se controla el `cache` del fetch, que es lo que Next
 * usa para decidir qué cachear en el build.
 */
async function fetchExtraThemes(): Promise<ThemeRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return FALLBACK_THEMES;

  try {
    const res = await fetch(
      `${url}/rest/v1/themes?select=*&enabled=eq.true&order=sort_order.asc,id.asc`,
      {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: "force-cache",
      },
    );
    if (!res.ok) return FALLBACK_THEMES;

    const rows = (await res.json()) as ThemeRow[];
    if (!Array.isArray(rows) || rows.length === 0) return FALLBACK_THEMES;
    return rows.map(rowToRecord);
  } catch {
    return FALLBACK_THEMES;
  }
}

/** Temas extra + su CSS ya generado, listos para el <style> del layout. */
export async function getThemesData(): Promise<{
  extraThemes: ThemeRecord[];
  css: string;
}> {
  const extraThemes = await fetchExtraThemes();
  return { extraThemes, css: buildThemesCss(extraThemes) };
}
