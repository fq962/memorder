"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import MemorizeTimer from "../components/MemorizeTimer";
import JokerReveal from "../components/JokerReveal";
import JokerCard from "../components/JokerCard";
import { JOKERS, rollJoker, X15_BOOST, type JokerId } from "../lib/jokers";
import cerebri from "../images/cerebri.png";
import calaca from "../images/calaca.png";
import { playSound, playTick, preloadSounds, unlockAudio } from "../lib/sounds";
import { setPlaying } from "../lib/hud";
import { useSettings } from "../lib/settings";
import { ICONS } from "../lib/icons";
import { createRng, newSeed, normalizeSeed, type Rng } from "../lib/rng";
import {
  buildRound,
  countMultiplier,
  move,
  perfectBonus,
  pinAt,
  placeCorrect,
  shuffleDistinct,
  speedMultiplier,
  wordPoints,
  type Round,
} from "./game";

type Phase = "idle" | "showing" | "arrange" | "checking" | "gameover";

/** Milisegundos entre la comprobación de una palabra y la siguiente. */
const CHECK_STEP_MS = 500;

/** Tiempo que las palabras quedan visibles tras aparecer la última. */
const SHOW_HOLD_MS = 3000;

/** Tiempo para ORDENAR las palabras, con cuenta atrás de milisegundos. */
const ARRANGE_MS = 30000;

/** Inclinación pseudo-aleatoria estable por índice, para el desorden de las cartas. */
function tiltFor(i: number): string {
  const seq = [-3, 2, -1.5, 3, -2.5, 1.5, -2, 2.5];
  return `${seq[i % seq.length]}deg`;
}

/**
 * Tamaño de las filas según cuántas palabras tenga la ronda. Con 10-15 la
 * lista no cabe en un móvil, así que las cartas se aprietan en vez de dejar
 * que la ronda se salga de la pantalla. Se usa igual al memorizar y al
 * ordenar para que las cartas no cambien de tamaño entre fases.
 */
function densityFor(count: number) {
  if (count <= 5) {
    return {
      list: "gap-3",
      row: "gap-4 px-5 py-3.5",
      num: "h-8 w-8 text-[10px]",
      word: "text-xl sm:text-2xl",
    };
  }
  if (count <= 9) {
    return {
      list: "gap-2",
      row: "gap-3 px-4 py-2.5",
      num: "h-7 w-7 text-[9px]",
      word: "text-base sm:text-xl",
    };
  }
  return {
    list: "gap-1.5",
    row: "gap-2.5 px-3 py-2",
    num: "h-6 w-6 text-[8px]",
    word: "text-sm sm:text-lg",
  };
}

/** Aciertos seguidos a partir de los cuales el marcador ya no crece más. */
const MAX_STREAK_GROWTH = 8;

/** Milisegundos sin sumar puntos tras los que el marcador vuelve a su tamaño. */
const STREAK_COOLDOWN_MS = 1100;

/**
 * Muestra un número subiendo poco a poco hasta su valor real.
 *
 * Además acumula racha: cada subida seguida agranda el marcador un poco más
 * (hasta MAX_STREAK_GROWTH aciertos) y le sube el brillo, de modo que la
 * cadena de palabras acertadas se siente como un crescendo. Cuando pasa
 * STREAK_COOLDOWN_MS sin sumar, vuelve suavemente a su tamaño normal.
 */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;

    setStreak((s) => Math.min(MAX_STREAK_GROWTH, s + 1));
    // Se reinicia en cada subida: la racha solo decae si el marcador se para.
    const cooldown = setTimeout(() => setStreak(0), STREAK_COOLDOWN_MS);

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const eased = 1 - (1 - t) ** 3;
      const next = Math.round(from + (value - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // En pestañas ocultas rAF no corre: este temporizador asegura el valor final.
    const settle = setTimeout(() => {
      shownRef.current = value;
      setShown(value);
    }, 650);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      clearTimeout(cooldown);
    };
  }, [value]);

  // El marcador crece con la racha; el origen a la derecha evita que se salga
  // de la cabecera al agrandarse.
  const grow = 1 + streak * 0.11;
  const glow = streak * 0.09;

  return (
    <span
      className="inline-block origin-right transition-[scale,filter] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none"
      style={{
        scale: `${grow}`,
        filter: `drop-shadow(0 0 ${streak * 3}px rgb(255 203 43 / ${glow}))`,
      }}
    >
      {/* El golpe por acierto va en un span aparte, con key, para que se
          relance en cada subida sin cortar la transición de la racha. */}
      <span
        key={value}
        className="animate-score-pop text-chip-gold inline-block origin-center tabular-nums"
      >
        {shown}
      </span>
    </span>
  );
}

/** Milisegundos que el seed se queda diciendo "copiado" tras pulsarlo. */
const SEED_COPIED_MS = 1600;

/**
 * Seed de la partida en el Game Over: se pulsa y se copia al portapapeles,
 * para poder repetir exactamente la misma run o mandársela a alguien.
 */
function SeedChip({ seed }: { seed: string }) {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(seed);
    } catch {
      // Sin permiso o fuera de contexto seguro (http): se selecciona el
      // texto para que se pueda copiar a mano en vez de no hacer nada.
      const node = document.getElementById("seed-value");
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
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), SEED_COPIED_MS);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={t("play.gameoverSeedHint")}
      className="card-base bg-card-face/95 text-card-ink group flex max-w-full flex-col items-center gap-1 px-6 py-3 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="font-sans text-[11px] opacity-60">
        {t("play.gameoverSeed")}
      </span>
      <span
        id="seed-value"
        className="font-display text-chip-purple text-lg tracking-[0.18em] tabular-nums select-all"
      >
        {seed}
      </span>
      <span
        aria-live="polite"
        className={`font-display text-[9px] tracking-widest ${
          copied ? "text-chip-green" : "opacity-45"
        }`}
      >
        {copied ? t("play.gameoverSeedCopied") : t("play.gameoverSeedHint")}
      </span>
    </button>
  );
}

/**
 * Entrada de semilla en la pantalla inicial: se pega un código y la partida
 * sale idéntica a la de quien lo compartió.
 *
 * Empieza plegada tras un botón para no competir con COMENZAR: jugar una
 * semilla concreta es lo raro, no lo normal.
 */
function SeedEntry({ onPlay }: { onPlay: (seed: string) => void }) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Lo que se jugará de verdad: el seed en su forma canónica, o null si lo
  // escrito no tiene ni un carácter aprovechable.
  const seed = normalizeSeed(raw);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-display text-cream/45 hover:text-chip-purple text-[10px] tracking-widest transition-colors"
      >
        {t("play.seedEntryToggle")}
      </button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (seed) onPlay(seed);
      }}
      className="card-base bg-card-face/95 text-card-ink flex w-full max-w-sm flex-col gap-2 px-5 py-4"
    >
      <label
        htmlFor="seed-input"
        className="font-sans text-[11px] opacity-60"
      >
        {t("play.seedEntryLabel")}
      </label>
      <div className="flex items-center gap-2">
        <input
          id="seed-input"
          ref={inputRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="MWAX-CRK7"
          autoComplete="off"
          spellCheck={false}
          maxLength={40}
          className="font-display text-card-ink placeholder:text-card-ink/25 min-w-0 flex-1 rounded-md bg-black/10 px-3 py-2 text-base tracking-[0.14em] uppercase outline-none focus:bg-black/15"
        />
        <button
          type="submit"
          disabled={!seed}
          className="card-base bg-chip-green text-card-ink -skew-x-6 px-4 py-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
        >
          <span className="font-display block skew-x-6 text-xs">
            {t("play.seedEntryPlay")}
          </span>
        </button>
      </div>
      {/* El seed se juega en su forma canónica: se enseña para que no haya
          sorpresas con lo que se pegó (minúsculas, espacios, letras fuera
          del alfabeto). */}
      <p className="font-sans text-[10px] opacity-55">
        {raw.trim() === ""
          ? t("play.seedEntryHint")
          : seed
            ? `${t("play.seedEntryWillPlay")} ${seed}`
            : t("play.seedEntryInvalid")}
      </p>
    </motion.form>
  );
}

export default function PlayPage() {
  const { language, t } = useSettings();
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [wordsCorrect, setWordsCorrect] = useState(0);
  const [current, setCurrent] = useState<Round | null>(null);
  const [board, setBoard] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  // Casilla que acaba de recibir una palabra por teclado: dispara el flash.
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  // Palabras ya comprobadas como correctas y posición del primer fallo.
  const [checkIndex, setCheckIndex] = useState(0);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  // Dispara la sacudida de pantalla al fallar.
  const [shake, setShake] = useState(false);
  // Multiplicador de rapidez de la ronda: se congela al enviar el orden para
  // que los +N que se muestran al comprobar coincidan con lo que se suma.
  const [speed, setSpeed] = useState(1);
  // Comodín encontrado que se está enseñando: mientras hay uno, la
  // comprobación se queda en pausa y la carta ocupa la pantalla.
  const [joker, setJoker] = useState<JokerId | null>(null);
  // Comodín guardado en la cabecera, a la espera de gastarse en la ronda
  // siguiente (el que se está enseñando pasa aquí al pulsar CONTINUAR).
  const [held, setHeld] = useState<JokerId | null>(null);
  // Comodín que se está gastando en la ronda en curso. Vive hasta que empieza
  // la siguiente: sus efectos duran también la comprobación.
  const [applied, setApplied] = useState<JokerId | null>(null);
  // Palabra que Free Order ha dejado ya colocada en su sitio esta ronda.
  const [hintWord, setHintWord] = useState<string | null>(null);
  // Seed de la partida en curso: se enseña en el Game Over para poder
  // repetirla. null antes de la primera partida.
  const [seed, setSeed] = useState<string | null>(null);

  /** Multiplicador de puntos de la ronda: solo lo sube el comodín ×1.5. */
  const boost = applied === "x1-5" ? X15_BOOST : 1;

  // Dado de la partida, creado a partir del seed al empezar. Vive en una ref
  // porque lo consume la lógica de juego (efectos y callbacks), no el render:
  // cada tirada muta su estado interno y eso no debe repintar nada.
  const rngRef = useRef<Rng | null>(null);
  // Palabras de las últimas 5 rondas, para no repetirlas.
  const recentRef = useRef<string[][]>([]);
  // Última ronda en la que ya se tiró por comodín: una tirada por ronda.
  const rolledRoundRef = useRef(0);
  // Ronda actual en una ref para que el callback del cronómetro sea estable.
  const currentRef = useRef<Round | null>(null);
  // Instante en que empezó la fase de ordenar, para medir cuánto se tarda.
  const arrangeStartRef = useRef(0);
  // Tablero y selección actuales en refs: el listener de teclado se registra
  // una sola vez por fase y necesita leer siempre el valor más reciente. Se
  // sincronizan en un efecto (escribirlas en render rompe las reglas de hooks)
  // y eso basta: el teclado siempre llega después de pintar.
  const boardRef = useRef<string[]>(board);
  const selectedRef = useRef<number | null>(selected);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  // Casilla que Free Order deja clavada: ni la palabra regalada se mueve de
  // ahí, ni ninguna otra puede ocupar su sitio. -1 cuando no hay comodín.
  const lockedIndex =
    hintWord && current ? current.words.indexOf(hintWord) : -1;
  const lockedIndexRef = useRef(lockedIndex);
  const hintWordRef = useRef(hintWord);
  useEffect(() => {
    lockedIndexRef.current = lockedIndex;
    hintWordRef.current = hintWord;
  }, [lockedIndex, hintWord]);

  // Cuánto ocupan las cartas esta ronda: cuantas más palabras, más apretadas.
  const size = densityFor(current?.words.length ?? 0);

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // El navegador dispara un click nativo tras soltar un arrastre: esta
  // bandera evita que ese click reutilice la lógica de selección por toque.
  const justDraggedRef = useRef(false);
  const dragEndTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Precarga (descarga + decodifica) todos los sonidos al abrir el juego.
  useEffect(() => {
    void preloadSounds();
  }, []);

  // Mientras hay ronda en marcha se esconde el botón de ajustes del layout:
  // en móvil se comía la esquina de la cabecera. En la pantalla inicial y en
  // el Game Over vuelve a estar disponible.
  const inRound = phase !== "idle" && phase !== "gameover";
  useEffect(() => {
    setPlaying(inRound);
    return () => setPlaying(false);
  }, [inRound]);

  const startRound = useCallback(
    (next: number) => {
      const rng = rngRef.current;
      if (!rng) return;

      const generated = buildRound(
        rng,
        next,
        recentRef.current.flat(),
        language,
      );
      recentRef.current = [generated.words, ...recentRef.current].slice(0, 5);
      currentRef.current = generated;
      setCurrent(generated);
      // El comodín de la ronda anterior ya cumplió: se retira aquí, no al
      // enviar el orden, para que su efecto dure toda la comprobación.
      setApplied(null);
      setHintWord(null);
      setSelected(null);
      setCheckIndex(0);
      setWrongIndex(null);
      setPhase("showing");
    },
    [language],
  );

  // Fase de memorización: las palabras aparecen repartidas y se mantienen
  // SHOW_HOLD_MS después de que salga la última; luego se baraja y a ordenar.
  useEffect(() => {
    if (phase !== "showing" || !current) return;
    const rng = rngRef.current;
    if (!rng) return;

    const revealMs = current.words.length * 70 + 500;
    const timer = setTimeout(() => {
      let dealt = shuffleDistinct(rng, current.words);
      let hint: string | null = null;

      // El comodín guardado se gasta aquí, al repartir.
      if (held === "free-order") {
        // Una palabra al azar se reparte ya en su sitio.
        hint = rng.pick(current.words) ?? null;
        if (hint) dealt = placeCorrect(dealt, current.words, hint);
      }
      if (held) {
        setApplied(held);
        setHeld(null);
      }

      setBoard(dealt);
      setHintWord(hint);
      arrangeStartRef.current = performance.now();
      setPhase("arrange");
    }, revealMs + SHOW_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, current, held]);

  // Cierra la fase de ordenar: congela el multiplicador de rapidez con el
  // tiempo empleado y pasa a comprobar. Estable (solo setters y refs) para no
  // reiniciar el cronómetro en cada render.
  const finishArrange = useCallback(() => {
    const elapsed = performance.now() - arrangeStartRef.current;
    setSpeed(speedMultiplier(elapsed, ARRANGE_MS));
    setSelected(null);
    setCheckIndex(0);
    setWrongIndex(null);
    setPhase("checking");
  }, []);

  function handleTap(index: number) {
    // Click "fantasma" tras soltar un arrastre: se ignora y se deselecciona.
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      setSelected(null);
      return;
    }
    // La casilla clavada no se elige ni sirve de destino: ni sale su palabra
    // ni entra otra.
    if (index === lockedIndex) return;
    if (selected === null) {
      setSelected(index);
      playTick(660);
      return;
    }
    // El intercambio puede correr a la regalada de su casilla: se re-clava.
    if (selected !== index) {
      setBoard((b) => pinAt(move(b, selected, index), hintWord, lockedIndex));
    }
    setSelected(null);
  }

  /**
   * Reordenación por arrastre con la casilla de Free Order clavada.
   *
   * Framer propone los cambios de uno en uno: para pasar una carta al otro
   * lado de la clavada, primero propone intercambiarla CON la clavada. Si ahí
   * nos limitáramos a devolver la regalada a su sitio, el intercambio se
   * deshace y la carta se queda atascada sin poder cruzar. Por eso ese caso
   * se traduce a lo que el jugador quiere: la carta salta al otro lado y las
   * demás se corren, con la regalada quieta en su casilla.
   */
  function handleReorder(next: string[]) {
    if (!hintWord || lockedIndex < 0) {
      setBoard(next);
      return;
    }
    if (next.indexOf(hintWord) === lockedIndex) {
      setBoard(next);
      return;
    }

    const others = next.filter((w) => w !== hintWord);
    const before = board.filter((w) => w !== hintWord);
    // Si el resto no ha cambiado de orden, lo único que propone framer es el
    // intercambio con la clavada: es un intento de cruce.
    const crossing = others.every((w, i) => w === before[i]);

    if (crossing) {
      // La regalada se fue hacia abajo => quien la empujó subía, y al revés.
      const step = next.indexOf(hintWord) > lockedIndex ? -1 : 1;
      const from = others.indexOf(next[lockedIndex]);
      const to = Math.min(others.length - 1, Math.max(0, from + step));
      if (from >= 0 && to !== from) {
        const jumped = move(others, from, to);
        jumped.splice(lockedIndex, 0, hintWord);
        setBoard(jumped);
        return;
      }
    }

    setBoard(pinAt(next, hintWord, lockedIndex));
  }

  // Al pulsar CONTINUAR la carta deja de ocupar la pantalla y se guarda en la
  // cabecera, donde espera a gastarse en la ronda siguiente.
  const dismissJoker = useCallback(() => {
    if (joker) setHeld(joker);
    setJoker(null);
  }, [joker]);

  // Pequeño destello + tick sonoro sobre una casilla: feedback de "acción
  // completada" para los cambios que no vienen de un arrastre.
  const flash = useCallback((index: number) => {
    setFlashIndex(index);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashIndex(null), 320);
  }, []);

  // Coloca la palabra seleccionada en la posición `target` (0-indexed).
  const moveSelectedTo = useCallback(
    (target: number) => {
      const board = boardRef.current;
      const from = selectedRef.current;
      const len = board.length;
      if (from === null || target < 0 || target >= len) return;
      // Ni se saca la palabra clavada ni se le quita el sitio.
      const locked = lockedIndexRef.current;
      if (from === locked || target === locked) return;

      // Al colocar por encima o por debajo de la casilla clavada, la regalada
      // se correría: se re-clava y la palabra movida acaba donde toque.
      const word = board[from];
      const next = pinAt(move(board, from, target), hintWordRef.current, locked);
      const landed = next.indexOf(word);
      setBoard(next);
      // A diferencia del mouse, el teclado deja la palabra seleccionada en su
      // nueva casilla para poder seguir ajustándola sin volver a elegirla.
      setSelected(landed);
      playTick(landed > from ? 990 : 740);
      flash(landed);
    },
    [flash],
  );

  // Control por teclado (para speedrunners): ↑/↓ mueven el cursor de
  // selección, un dígito de la fila numérica coloca la palabra seleccionada
  // en esa casilla, Enter comprueba y Escape suelta la selección. Se lee
  // siempre desde refs para no tener que re-registrar el listener en cada
  // cambio de tablero.
  useEffect(() => {
    if (phase !== "arrange") return;

    function handleKeyDown(e: KeyboardEvent) {
      const len = boardRef.current.length;
      if (len === 0) return;

      const locked = lockedIndexRef.current;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = selectedRef.current;
        const base = cur ?? (e.key === "ArrowDown" ? -1 : 0);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        // El cursor salta por encima de la casilla clavada: no hay nada que
        // hacer en ella.
        let next = (base + delta + len) % len;
        if (next === locked) next = (next + delta + len) % len;
        if (next === locked) return;
        setSelected(next);
        playTick(e.key === "ArrowDown" ? 520 : 620);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        finishArrange();
        return;
      }

      if (e.key === "Escape") {
        setSelected(null);
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        const n = Number(e.key);
        const target = (n === 0 ? 10 : n) - 1;
        if (target >= len || target === locked) return;
        e.preventDefault();
        if (selectedRef.current === null) {
          setSelected(target);
          playTick(660);
        } else {
          moveSelectedTo(target);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, moveSelectedTo, finishArrange]);

  // Comprueba una palabra por paso, sumando sus puntos si es correcta.
  useEffect(() => {
    if (phase !== "checking" || !current) return;
    // Hay un comodín en pantalla: la comprobación espera a que se cierre.
    if (joker) return;

    // Ya hay un fallo: se deja ver un momento antes del Game Over.
    if (wrongIndex !== null) {
      const timer = setTimeout(() => setPhase("gameover"), 900);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      if (checkIndex >= board.length) {
        // Todas correctas: suena la ronda ganada y salta a la siguiente.
        playSound("correct-round");
        setScore((s) => s + perfectBonus(current.words, speed, boost));
        const next = round + 1;
        setRound(next);
        startRound(next);
        return;
      }

      if (board[checkIndex] === current.words[checkIndex]) {
        // Palabra correcta: efecto escalera (tono sube con cada acierto).
        playSound("correct-word", { rate: 1 + checkIndex * 0.08 });
        setScore(
          (s) =>
            s +
            wordPoints(board[checkIndex], current.words.length, speed, boost),
        );
        setWordsCorrect((c) => c + 1);
        setCheckIndex((i) => i + 1);

        // Tirada de comodín: UNA por ronda, no una por palabra. Se hace al
        // validar la última palabra, o sea con la ronda ya ganada: los
        // porcentajes son la probabilidad de llevarte carta por ronda
        // superada. La comprobación se queda en pausa mientras se enseña, y
        // el bonus Perfect y la ronda siguiente esperan a CONTINUAR.
        // No se tira si ya hay uno en la mano, para no pisarlo.
        const lastWord = checkIndex === board.length - 1;
        if (
          lastWord &&
          rolledRoundRef.current !== round &&
          !held &&
          rngRef.current
        ) {
          rolledRoundRef.current = round;
          const dropped = rollJoker(rngRef.current);
          if (dropped) {
            playSound("correct-round", { rate: 0.85 });
            setJoker(dropped);
          }
        }
      } else {
        // Fallo: suena game over y se sacude la pantalla.
        playSound("gameover");
        setWrongIndex(checkIndex);
        setShake(true);
        setTimeout(() => setShake(false), 520);
      }
    }, CHECK_STEP_MS);
    return () => clearTimeout(timer);
  }, [
    phase,
    current,
    board,
    checkIndex,
    wrongIndex,
    round,
    speed,
    boost,
    joker,
    held,
    startRound,
  ]);

  /**
   * Arranca una partida: crea el dado que decidirá palabras, reparto y
   * comodines de toda la run.
   *
   * @param requested  semilla ya normalizada para repetir una partida
   *                   concreta; sin ella se genera una nueva.
   *
   * Ojo: el seed reproduce las TIRADAS, no los ajustes. La misma semilla en
   * otro idioma usa otro banco de palabras, y los trucos (palabras por ronda,
   * probabilidad de comodín) también cambian la partida resultante.
   *
   * El seed nuevo se genera aquí, en respuesta a un click, y no durante el
   * render: usa entropía real y en el render rompería la hidratación.
   */
  function startGame(requested?: string) {
    unlockAudio();
    playSound("game-start");
    const fresh = requested ?? newSeed();
    rngRef.current = createRng(fresh);
    setSeed(fresh);
    recentRef.current = [];
    rolledRoundRef.current = 0;
    setJoker(null);
    setHeld(null);
    setApplied(null);
    setHintWord(null);
    setSpeed(1);
    setScore(0);
    setWordsCorrect(0);
    setRound(1);
    startRound(1);
  }

  return (
    <main
      className={`relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:gap-8 sm:px-6 sm:py-10 ${
        shake ? "shake-screen" : ""
      }`}
    >
      {/* Hallazgo de comodín: se superpone a todo y pausa la comprobación. */}
      <AnimatePresence>
        {joker && (
          <JokerReveal joker={joker} onDismiss={dismissJoker} />
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-cream/50 hover:text-cream text-xs transition-colors"
        >
          ← memorder
        </Link>
        {phase !== "idle" && (
          <p className="font-display flex items-center gap-3 text-sm">
            <span className="card-base bg-chip-purple/90 text-cream -skew-x-6 px-3 py-1.5">
              <span className="block skew-x-6 text-[10px]">
                {t("play.round")} {round}
              </span>
            </span>

            {/* Cartas en juego: la que se está gastando esta ronda (algo
                apagada) y la que espera en la mano. */}
            {[
              { id: applied, inUse: true },
              { id: held, inUse: false },
            ].map(({ id, inUse }) =>
              id ? (
                <motion.span
                  key={inUse ? "applied" : "held"}
                  initial={{ opacity: 0, scale: 0.3, rotate: -18, y: -10 }}
                  animate={{
                    opacity: inUse ? 0.65 : 1,
                    scale: 1,
                    rotate: -4,
                    y: 0,
                  }}
                  transition={{ type: "spring", stiffness: 320, damping: 17 }}
                  role="img"
                  aria-label={`${inUse ? t("joker.inUse") : t("joker.held")}: ${t(
                    JOKERS[id].nameKey,
                  )}`}
                  title={t(JOKERS[id].nameKey)}
                  className="inline-block"
                >
                  <JokerCard
                    joker={JOKERS[id]}
                    width={26}
                    className="rounded-[3px] ring-2 ring-[var(--holo-glow)] [filter:drop-shadow(0_0_10px_var(--holo-glow))]"
                  />
                </motion.span>
              ) : null,
            )}

            <span className="ml-2 text-lg">
              <CountUp value={score} />
            </span>
          </p>
        )}
      </header>

      {phase === "idle" && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
        >
          <Image
            src={cerebri}
            alt="Cerebri"
            priority
            className="animate-float w-44 max-w-full drop-shadow-[0_10px_25px_rgba(255,95,200,0.35)] sm:w-52"
          />
          <h1 className="font-display text-chrome text-3xl sm:text-5xl">
            MEMORY
            <br />
            SEQUENCE
          </h1>
          <p className="font-sans text-cream/70 max-w-md text-base">
            {t("play.idleDescriptionPre")}{" "}
            <span className="text-chip-red font-bold">
              {t("play.idleDescriptionBold")}
            </span>{" "}
            {t("play.idleDescriptionPost")}{" "}
            <span className="inline-flex items-center gap-1 align-middle">
              <Image src={ICONS.brain} alt="" width={18} height={16} />
              <Image src={ICONS.fire} alt="" width={14} height={20} />
            </span>
          </p>
          <button
            type="button"
            onClick={() => startGame()}
            className="group card-base bg-chip-green animate-bob text-card-ink -rotate-2 px-10 py-5 transition-transform duration-150 hover:-rotate-1 hover:scale-110 hover:brightness-110 active:scale-95"
          >
            <span className="font-display block text-2xl [text-shadow:2px_2px_0_rgba(0,0,0,0.35)]">
              {t("play.start")}
            </span>
          </button>

          <SeedEntry onPlay={startGame} />
        </motion.section>
      )}

      {phase === "showing" && current && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col gap-4 sm:gap-6"
        >
          {/* Solo memorización: las palabras aparecen y se quedan 3 s. Aquí
              NO hay cuenta atrás; el cronómetro llega en la fase de ordenar. */}
          <p className="font-display text-chip-gold animate-pulse flex items-center justify-center gap-2 text-center text-[10px] tracking-widest">
            <Image src={ICONS.brain} alt="" width={16} height={14} />
            {t("play.showingHint")}
          </p>

          {/* Todas las palabras salen de golpe, repartidas como cartas. */}
          <ol className={`flex flex-col ${size.list}`}>
            {current.words.map((word, i) => (
              <li
                key={word}
                style={
                  {
                    "--tilt": tiltFor(i),
                    animationDelay: `${i * 70}ms`,
                  } as React.CSSProperties
                }
                className="animate-card-deal card-base bg-card-face text-card-ink"
              >
                <div className={`flex items-center ${size.row}`}>
                  <span
                    className={`font-display bg-chip-blue text-cream flex shrink-0 items-center justify-center rounded-md [box-shadow:inset_0_2px_0_rgba(255,255,255,0.4)] ${size.num}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`flex-1 truncate font-sans font-bold ${size.word}`}
                  >
                    {word}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      {(phase === "arrange" || phase === "checking") && current && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-1 flex-col gap-4 pb-20 sm:gap-6"
        >
          {/* Cuenta atrás de 30 s para ordenar, con milisegundos. Los últimos
              3 s se ponen gigantes detrás de las cartas. Solo mientras se
              ordena; al comprobar se desmonta y se detiene. */}
          {phase === "arrange" && (
            <MemorizeTimer
              key={round}
              durationMs={ARRANGE_MS}
              onDone={finishArrange}
            />
          )}

          <p className="font-sans text-cream/70 pt-12 text-center text-sm sm:pt-14 sm:text-base">
            {phase === "checking" ? (
              t("play.checkingLabel")
            ) : (
              <>
                {t("play.arrangeHint")}
                {/* La ayuda de teclado no pinta nada en un móvil. */}
                <span className="text-cream/45 hidden text-sm sm:block">
                  {t("play.keyboardHint")}
                </span>
              </>
            )}
          </p>

          {/* De dónde salen los puntos: cantidad de palabras y rapidez. */}
          {phase === "checking" && (
            <p className="font-display flex flex-wrap justify-center gap-3 text-[10px]">
              <span className="card-base bg-chip-blue/90 text-cream -skew-x-6 px-3 py-1.5">
                <span className="block skew-x-6">
                  🃏 {current.words.length} {t("play.wordsChip")} ×
                  {countMultiplier(current.words.length).toFixed(2)}
                </span>
              </span>
              <span className="card-base bg-chip-gold text-card-ink -skew-x-6 px-3 py-1.5">
                <span className="block skew-x-6">
                  ⚡ {t("play.speedChip")} ×{speed.toFixed(2)}
                </span>
              </span>
              {boost > 1 && (
                <span className="card-base bg-chip-green text-card-ink -skew-x-6 px-3 py-1.5">
                  <span className="block skew-x-6">
                    🃏 {t("play.jokerChip")} ×{boost.toFixed(2)}
                  </span>
                </span>
              )}
            </p>
          )}

          <div className="relative">
            <Reorder.Group
              as="ol"
              axis="y"
              values={board}
              onReorder={handleReorder}
              className={`flex flex-col ${size.list}`}
            >
              {board.map((word, i) => {
                const checking = phase === "checking";
                const justScored = checking && i === checkIndex - 1;
                const isSelected = !checking && selected === i;
                const isFlashing = !checking && flashIndex === i;
                // Regalo del comodín: queda clavada en su casilla, así que la
                // marca verde siempre dice la verdad.
                const isFreeOrder = !checking && word === hintWord;
                let tone = "bg-card-face";
                let ink = "text-card-ink";
                if (checking && i < checkIndex) {
                  tone = "bg-chip-green";
                } else if (checking && i === wrongIndex) {
                  tone = "bg-chip-red";
                  ink = "text-cream";
                } else if (isSelected) {
                  tone = "bg-chip-gold";
                } else if (isFreeOrder) {
                  tone = "bg-chip-green";
                }

                return (
                  <Reorder.Item
                    key={word}
                    value={word}
                    as="li"
                    drag={!checking && !isFreeOrder}
                    dragListener
                    dragElastic={0.12}
                    dragTransition={{ bounceStiffness: 500, bounceDamping: 28 }}
                    whileDrag={{
                      scale: 1.07,
                      zIndex: 30,
                      boxShadow: "0 22px 34px -8px rgba(0,0,0,0.55)",
                    }}
                    whileTap={
                      !checking && !isFreeOrder ? { scale: 0.96 } : undefined
                    }
                    animate={{ scale: isSelected ? 1.035 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    onDragStart={() => {
                      justDraggedRef.current = true;
                    }}
                    onDragEnd={() => {
                      clearTimeout(dragEndTimerRef.current);
                      dragEndTimerRef.current = setTimeout(() => {
                        justDraggedRef.current = false;
                      }, 300);
                    }}
                    onClick={() => !checking && handleTap(i)}
                    style={{ "--tilt": tiltFor(i) } as React.CSSProperties}
                    className={`card-base transition-colors duration-300 ${tone} ${ink} ${
                      justScored || isFlashing ? "animate-row-flash" : ""
                    } ${
                      !checking && !isFreeOrder
                        ? "hover:-translate-y-1 hover:brightness-105 cursor-grab active:cursor-grabbing"
                        : "cursor-default"
                    } ${i === wrongIndex ? "animate-shake" : ""} ${
                      isSelected
                        ? "ring-chip-gold shadow-[0_0_24px_rgba(255,203,43,0.55)] ring-4 ring-offset-2 ring-offset-felt"
                        : ""
                    } ${
                      isFreeOrder
                        ? "ring-chip-green/70 shadow-[0_0_22px_rgba(61,220,132,0.5)] ring-2"
                        : ""
                    }`}
                  >
                    <div className={`flex items-center ${size.row}`}>
                      <span
                        className={`font-display bg-chip-blue text-cream flex shrink-0 items-center justify-center rounded-md [box-shadow:inset_0_2px_0_rgba(255,255,255,0.4)] ${size.num}`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`flex-1 truncate font-sans font-bold ${size.word}`}
                      >
                        {word}
                      </span>
                      {checking && i < checkIndex && (
                        <span className="font-display text-card-ink text-sm">
                          +{wordPoints(word, current.words.length, speed, boost)}
                        </span>
                      )}
                      {checking && i === wrongIndex && (
                        <span className="text-2xl">💥</span>
                      )}
                      {/* Sello del comodín: ya está en su sitio y no se mueve. */}
                      {isFreeOrder && (
                        <span className="font-display text-card-ink flex shrink-0 items-center gap-1 text-[9px] tracking-widest">
                          <span aria-hidden>🔒</span>
                          {t("joker.freeOrderTag")}
                        </span>
                      )}
                    </div>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Los puntos de la última palabra acertada salen disparados hacia arriba. */}
            {phase === "checking" && checkIndex > 0 && wrongIndex === null && (
              <span
                key={checkIndex}
                aria-hidden
                className="animate-points-fly pointer-events-none absolute inset-x-0 top-1/3 z-20 text-center"
              >
                <span className="font-display text-chrome text-5xl md:text-6xl">
                  +
                  {wordPoints(
                    board[checkIndex - 1],
                    current.words.length,
                    speed,
                    boost,
                  )}
                </span>
              </span>
            )}
          </div>

        </motion.section>
      )}

      {/* El botón va fijo al borde inferior: con 10-15 palabras la lista pasa
          de la pantalla y antes había que bajar a buscarlo. Vive FUERA de la
          sección a propósito: framer-motion le pone transform y un ancestro
          transformado ancla los position:fixed de dentro. El degradado tapa
          la lista al deslizarse (de ahí el pb de la sección). */}
      {(phase === "arrange" || phase === "checking") && (
        <div className="from-felt via-felt/90 fixed inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t to-transparent px-4 pt-8 pb-3">
          <button
            type="button"
            onClick={finishArrange}
            disabled={phase === "checking"}
            className="group card-base bg-chip-gold text-card-ink -skew-x-6 px-10 py-3 transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            <span className="font-display block skew-x-6 text-lg">
              {t("play.ready")}
            </span>
          </button>
        </div>
      )}

      {phase === "gameover" && current && (
        <motion.section
          initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex flex-1 flex-col items-center justify-center gap-6 text-center"
        >
          <Image
            src={calaca}
            alt="Game Over"
            className="animate-float w-48 max-w-full drop-shadow-[0_10px_30px_rgba(255,77,94,0.4)] sm:w-56"
          />
          <h1 className="font-display text-chrome text-4xl sm:text-5xl">
            GAME OVER
          </h1>

          <dl className="card-base bg-card-face text-card-ink flex w-full max-w-sm flex-col gap-3 px-8 py-6 font-sans text-base">
            <div className="flex justify-between gap-10">
              <dt className="opacity-60">{t("play.gameoverScore")}</dt>
              <dd className="font-display text-chip-red text-sm tabular-nums">
                {score}
              </dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="opacity-60">{t("play.gameoverRoundReached")}</dt>
              <dd className="font-display text-sm tabular-nums">{round}</dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="opacity-60">{t("play.gameoverWordsCorrect")}</dt>
              <dd className="font-display text-sm tabular-nums">
                {wordsCorrect}
              </dd>
            </div>
          </dl>

          <p className="font-sans text-cream/60 max-w-md text-sm">
            {t("play.gameoverCorrectOrder")}{" "}
            <span className="text-chip-gold font-bold">
              {current.words.join(" · ")}
            </span>
          </p>

          {seed && <SeedChip seed={seed} />}

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => startGame()}
              className="card-base bg-chip-green text-card-ink -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95"
            >
              <span className="font-display block skew-x-6 text-sm">
                {t("play.gameoverRetry")}
              </span>
            </button>
            {/* Revancha con la MISMA semilla: mismas palabras y mismas cartas,
                para volver a intentar la run que se acaba de perder. */}
            {seed && (
              <button
                type="button"
                onClick={() => startGame(seed)}
                className="card-base bg-chip-gold text-card-ink -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95"
              >
                <span className="font-display block skew-x-6 text-sm">
                  {t("play.gameoverSameSeed")}
                </span>
              </button>
            )}
            <Link
              href="/"
              className="card-base bg-chip-purple/90 text-cream -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95"
            >
              <span className="font-display flex skew-x-6 items-center gap-2 text-sm">
                <Image src={ICONS.trophy} alt="" width={16} height={16} />
                {t("play.gameoverRanking")}
              </span>
            </Link>
          </div>
        </motion.section>
      )}
    </main>
  );
}
