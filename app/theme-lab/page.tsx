"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSettings } from "../lib/settings";
import { playTick } from "../lib/sounds";
import {
  CORE_COLOR_FIELDS,
  buildChromeGradient,
  buildThemeCssBlock,
  type CoreColors,
} from "../lib/theme-engine";

/** Id fijo de la previsualización: no cambia aunque el slug esté a medio escribir. */
const DRAFT_ID = "theme-lab-draft";

/** Punto de partida: los colores del tema pedido en este cambio (Spider-Man). */
const DEFAULT_COLORS: CoreColors = {
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
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Escapa comillas simples para meter el valor en un literal SQL. */
function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function buildInsertSql(id: string, label: string, c: CoreColors): string {
  const cols = [
    "id",
    "label",
    "felt",
    "cream",
    "chip_red",
    "chip_blue",
    "chip_gold",
    "chip_green",
    "chip_purple",
    "chip_pink",
    "card_face",
    "card_ink",
  ];
  const values = [
    sqlString(id || "sin-nombre"),
    sqlString(label || id || "Sin nombre"),
    sqlString(c.felt),
    sqlString(c.cream),
    sqlString(c.chipRed),
    sqlString(c.chipBlue),
    sqlString(c.chipGold),
    sqlString(c.chipGreen),
    sqlString(c.chipPurple),
    sqlString(c.chipPink),
    sqlString(c.cardFace),
    sqlString(c.cardInk),
  ];
  return `insert into themes (\n  ${cols.join(", ")}\n) values (\n  ${values.join(", ")}\n)\non conflict (id) do update set\n  label = excluded.label,\n  felt = excluded.felt,\n  cream = excluded.cream,\n  chip_red = excluded.chip_red,\n  chip_blue = excluded.chip_blue,\n  chip_gold = excluded.chip_gold,\n  chip_green = excluded.chip_green,\n  chip_purple = excluded.chip_purple,\n  chip_pink = excluded.chip_pink,\n  card_face = excluded.card_face,\n  card_ink = excluded.card_ink;`;
}

export default function ThemeLabPage() {
  const { theme: realTheme } = useSettings();
  const previousThemeRef = useRef(realTheme);

  const [id, setId] = useState("spiderman");
  const [label, setLabel] = useState("Spider-Man");
  const [colors, setColors] = useState<CoreColors>(DEFAULT_COLORS);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  function setColor(key: keyof CoreColors, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  // Previsualización en vivo: mientras esta página esté montada, la app
  // entera se pinta con el borrador (mismo mecanismo que un tema real: un
  // <style> con el bloque generado + data-theme apuntándole). Al salir, se
  // devuelve el tema que el jugador tenía elegido de verdad.
  useEffect(() => {
    const themeToRestore = previousThemeRef.current;
    const styleTag = document.createElement("style");
    styleTag.id = "theme-lab-style";
    document.head.appendChild(styleTag);

    const root = document.documentElement;
    const applyDraft = () => {
      if (root.dataset.theme !== DRAFT_ID) root.dataset.theme = DRAFT_ID;
    };
    applyDraft();

    // SettingsProvider tiene su propio efecto que escribe data-theme con el
    // tema real; el orden entre el suyo y este (ancestro vs. descendiente,
    // en el mismo montaje inicial) no está garantizado, así que puede pisar
    // el borrador justo después. Un observer lo reafirma pase lo que pase,
    // mientras esta página siga montada.
    const observer = new MutationObserver(applyDraft);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      observer.disconnect();
      styleTag.remove();
      root.dataset.theme = themeToRestore;
    };
    // Solo al montar/desmontar: el contenido del <style> se actualiza en el
    // efecto de abajo, cada vez que cambian los colores.
  }, []);

  useEffect(() => {
    const styleTag = document.getElementById("theme-lab-style");
    if (!styleTag) return;
    styleTag.textContent = buildThemeCssBlock({ id: DRAFT_ID, label, ...colors });
  }, [colors, label]);

  const sql = buildInsertSql(slugify(id), label, colors);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
    } catch {
      const node = document.getElementById("sql-insert");
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return;
    }
    playTick(880);
    setCopied(true);
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="font-display text-cream/50 hover:text-cream w-fit text-xs transition-colors"
        >
          ← memorder
        </Link>
        <h1 className="font-display text-chrome text-2xl">Theme Lab</h1>
        <p className="font-sans text-cream/60 max-w-xl text-sm">
          Elegí los 10 colores núcleo de un tema nuevo. Todo lo demás (el
          título cromado, el brillo de fondo, la escala del ranking) se
          calcula solo — mirá la previsualización de acá abajo, que es la
          app entera repintada en vivo. Cuando te convenza, copiá el INSERT y
          corrélo en el SQL Editor de Supabase.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="card-base bg-card-face text-card-ink flex flex-col gap-4 px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-sans text-card-ink/70">Nombre</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="font-display rounded border border-black/15 bg-black/5 px-2 py-1.5 text-sm outline-none focus:border-chip-purple"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-sans text-card-ink/70">
                Id (data-theme)
              </span>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onBlur={() => setId((v) => slugify(v))}
                spellCheck={false}
                className="font-display rounded border border-black/15 bg-black/5 px-2 py-1.5 text-sm tracking-wide outline-none focus:border-chip-purple"
              />
            </label>
          </div>

          <div className="border-card-ink/10 flex flex-col gap-3 border-t pt-4">
            {CORE_COLOR_FIELDS.map(({ key, label: fieldLabel }) => (
              <ColorField
                key={key}
                label={fieldLabel}
                value={colors[key]}
                onChange={(v) => setColor(key, v)}
              />
            ))}
          </div>
        </section>

        <section
          className="relative flex flex-col gap-4 overflow-hidden rounded-xl p-6"
          style={{ background: colors.felt }}
        >
          <h2
            className="font-display text-3xl"
            style={{
              backgroundImage: buildChromeGradient(colors),
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            MEMORDER
          </h2>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Rojo", colors.chipRed],
                ["Azul", colors.chipBlue],
                ["Dorado", colors.chipGold],
                ["Verde", colors.chipGreen],
                ["Morado", colors.chipPurple],
                ["Rosa", colors.chipPink],
              ] as const
            ).map(([chipLabel, color]) => (
              <span
                key={chipLabel}
                className="font-display -skew-x-6 rounded px-3 py-1.5 text-[10px]"
                style={{ background: color, color: colors.cardInk }}
              >
                <span className="block skew-x-6">{chipLabel}</span>
              </span>
            ))}
          </div>

          <div
            className="flex flex-col gap-2 rounded-lg px-4 py-3"
            style={{ background: colors.cardFace, color: colors.cardInk }}
          >
            <p className="font-sans text-sm">
              Así se ve una carta: texto en la tinta sobre la cara elegida.
            </p>
            <span
              className="font-display w-fit -skew-x-6 rounded px-4 py-2 text-xs"
              style={{ background: colors.chipGold, color: colors.cardInk }}
            >
              <span className="block skew-x-6">¡LISTO! ✅</span>
            </span>
          </div>

          <p className="font-sans text-xs" style={{ color: colors.cream }}>
            Texto principal sobre el fieltro, con {colors.cream}.
          </p>
        </section>
      </div>

      <section className="card-base bg-card-face text-card-ink flex flex-col gap-3 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[10px] tracking-wide">
            INSERT para el SQL Editor de Supabase
          </p>
          <button
            type="button"
            onClick={copySql}
            className="card-base bg-chip-green text-card-ink -skew-x-6 px-4 py-2 transition-transform hover:scale-105 active:scale-95"
          >
            <span className="font-display block skew-x-6 text-xs">
              {copied ? "¡Copiado! ✅" : "Copiar INSERT"}
            </span>
          </button>
        </div>
        <pre
          id="sql-insert"
          className="overflow-x-auto rounded bg-black/85 p-4 font-mono text-xs text-cream select-all"
        >
          {sql}
        </pre>
      </section>
    </main>
  );
}

/**
 * Fila de un color núcleo: un <input type="color"> (el picker de verdad) más
 * un campo de texto con el mismo hex, para poder pegar un valor exacto sin
 * pelear con el selector nativo del navegador. Pensado para ir sobre la
 * tarjeta clara (card-face), por eso los tonos fijos en vez de los del tema.
 */
function ColorField(props: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span className="font-sans text-card-ink/70">{props.label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-black/15 bg-transparent"
        />
        <input
          type="text"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          spellCheck={false}
          className="font-display w-24 rounded border border-black/15 bg-black/5 px-2 py-1.5 text-xs tabular-nums outline-none focus:border-chip-purple"
        />
      </span>
    </label>
  );
}
