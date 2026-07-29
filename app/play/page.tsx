"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Reorder } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import MemorizeTimer from "../components/MemorizeTimer";
import cerebri from "../images/cerebri.png";
import calaca from "../images/calaca.png";
import {
  playSound,
  playTick,
  preloadSounds,
  unlockAudio,
} from "../lib/sounds";
import {
  buildRound,
  move,
  perfectBonus,
  shuffleDistinct,
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

/** Muestra un número subiendo poco a poco hasta su valor real. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return;

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
    };
  }, [value]);

  return (
    <span
      key={value}
      className="animate-score-pop text-chip-gold inline-block origin-center tabular-nums"
    >
      {shown}
    </span>
  );
}

export default function PlayPage() {
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

  // Palabras de las últimas 5 rondas, para no repetirlas.
  const recentRef = useRef<string[][]>([]);
  // Ronda actual en una ref para que el callback del cronómetro sea estable.
  const currentRef = useRef<Round | null>(null);
  // Tablero y selección actuales en refs: el listener de teclado se registra
  // una sola vez por fase y necesita leer siempre el valor más reciente.
  const boardRef = useRef<string[]>(board);
  boardRef.current = board;
  const selectedRef = useRef<number | null>(selected);
  selectedRef.current = selected;
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

  const startRound = useCallback((next: number) => {
    const generated = buildRound(next, recentRef.current.flat());
    recentRef.current = [generated.words, ...recentRef.current].slice(0, 5);
    currentRef.current = generated;
    setCurrent(generated);
    setSelected(null);
    setCheckIndex(0);
    setWrongIndex(null);
    setPhase("showing");
  }, []);

  // Fase de memorización: las palabras aparecen repartidas y se mantienen
  // SHOW_HOLD_MS después de que salga la última; luego se baraja y a ordenar.
  useEffect(() => {
    if (phase !== "showing" || !current) return;
    const revealMs = current.words.length * 70 + 500;
    const timer = setTimeout(() => {
      setBoard(shuffleDistinct(current.words));
      setPhase("arrange");
    }, revealMs + SHOW_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, current]);

  // Cuenta atrás de ordenar agotada: comprueba lo que haya (auto-submit).
  // Estable (setters) para no reiniciar el cronómetro en cada render.
  const handleTimeUp = useCallback(() => {
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
    if (selected === null) {
      setSelected(index);
      playTick(660);
      return;
    }
    if (selected !== index) setBoard((b) => move(b, selected, index));
    setSelected(null);
  }

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
      const from = selectedRef.current;
      const len = boardRef.current.length;
      if (from === null || target < 0 || target >= len) return;
      if (target !== from) setBoard((b) => move(b, from, target));
      // A diferencia del mouse, el teclado deja la palabra seleccionada en su
      // nueva casilla para poder seguir ajustándola sin volver a elegirla.
      setSelected(target);
      playTick(target > from ? 990 : 740);
      flash(target);
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

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = selectedRef.current;
        const base = cur ?? (e.key === "ArrowDown" ? -1 : 0);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const next = (base + delta + len) % len;
        setSelected(next);
        playTick(e.key === "ArrowDown" ? 520 : 620);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        submit();
        return;
      }

      if (e.key === "Escape") {
        setSelected(null);
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        const n = Number(e.key);
        const target = (n === 0 ? 10 : n) - 1;
        if (target >= len) return;
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
  }, [phase, moveSelectedTo]);

  // Comprueba una palabra por paso, sumando sus puntos si es correcta.
  useEffect(() => {
    if (phase !== "checking" || !current) return;

    // Ya hay un fallo: se deja ver un momento antes del Game Over.
    if (wrongIndex !== null) {
      const timer = setTimeout(() => setPhase("gameover"), 900);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      if (checkIndex >= board.length) {
        // Todas correctas: suena la ronda ganada y salta a la siguiente.
        playSound("correct-round");
        setScore((s) => s + perfectBonus(current.words, round));
        const next = round + 1;
        setRound(next);
        startRound(next);
        return;
      }

      if (board[checkIndex] === current.words[checkIndex]) {
        // Palabra correcta: efecto escalera (tono sube con cada acierto).
        playSound("correct-word", { rate: 1 + checkIndex * 0.08 });
        setScore((s) => s + wordPoints(board[checkIndex], round));
        setWordsCorrect((c) => c + 1);
        setCheckIndex((i) => i + 1);
      } else {
        // Fallo: suena game over y se sacude la pantalla.
        playSound("gameover");
        setWrongIndex(checkIndex);
        setShake(true);
        setTimeout(() => setShake(false), 520);
      }
    }, CHECK_STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, current, board, checkIndex, wrongIndex, round, startRound]);

  function submit() {
    setSelected(null);
    setCheckIndex(0);
    setWrongIndex(null);
    setPhase("checking");
  }

  function restart() {
    unlockAudio();
    playSound("game-start");
    recentRef.current = [];
    setScore(0);
    setWordsCorrect(0);
    setRound(1);
    startRound(1);
  }

  return (
    <main
      className={`relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10 ${
        shake ? "shake-screen" : ""
      }`}
    >
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-cream/50 hover:text-cream text-xs transition-colors"
        >
          ← memorder
        </Link>
        {phase !== "idle" && (
          <p className="font-display flex items-center gap-5 text-sm">
            <span className="card-base bg-chip-purple/90 text-cream -skew-x-6 px-3 py-1.5">
              <span className="block skew-x-6 text-[10px]">RONDA {round}</span>
            </span>
            <span className="text-lg">
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
            Memoriza el orden en el que aparecen las palabras. Después
            reconstrúyelo arrastrándolas.{" "}
            <span className="text-chip-red font-bold">Un solo error</span> termina
            la partida. 🧠🔥
          </p>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              playSound("game-start");
              startRound(1);
            }}
            className="group card-base bg-chip-green animate-bob text-card-ink -rotate-2 px-10 py-5 transition-transform duration-150 hover:-rotate-1 hover:scale-110 hover:brightness-110 active:scale-95"
          >
            <span className="font-display block text-2xl [text-shadow:2px_2px_0_rgba(0,0,0,0.35)]">
              ▶ COMENZAR
            </span>
          </button>
        </motion.section>
      )}

      {phase === "showing" && current && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col gap-6"
        >
          {/* Solo memorización: las palabras aparecen y se quedan 3 s. Aquí
              NO hay cuenta atrás; el cronómetro llega en la fase de ordenar. */}
          <p className="font-display text-chip-gold animate-pulse text-center text-[10px] tracking-widest">
            🧠 MEMORIZA EL ORDEN 👀
          </p>

          {/* Todas las palabras salen de golpe, repartidas como cartas. */}
          <ol className="flex flex-col gap-3">
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
                <div className="flex items-center gap-5 px-6 py-4">
                  <span className="font-display bg-chip-blue text-cream flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs [box-shadow:inset_0_2px_0_rgba(255,255,255,0.4)]">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate font-sans text-2xl font-bold">
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
          className="flex flex-1 flex-col gap-6"
        >
          {/* Cuenta atrás de 30 s para ordenar, con milisegundos. Los últimos
              3 s se ponen gigantes detrás de las cartas. Solo mientras se
              ordena; al comprobar se desmonta y se detiene. */}
          {phase === "arrange" && (
            <MemorizeTimer
              key={round}
              durationMs={ARRANGE_MS}
              onDone={handleTimeUp}
            />
          )}

          <p className="font-sans text-cream/70 pt-14 text-center text-base">
            {phase === "checking" ? (
              "Comprobando el orden… 🎰"
            ) : (
              <>
                Arrástralas al orden original — o toca una y luego otra para
                intercambiarlas. 🃏
                <br />
                <span className="text-cream/45 text-sm">
                  Teclado: ↑ ↓ para elegir, un número para soltarla, Enter
                  para comprobar.
                </span>
              </>
            )}
          </p>

          <div className="relative">
            <Reorder.Group
              as="ol"
              axis="y"
              values={board}
              onReorder={setBoard}
              className="flex flex-col gap-3"
            >
              {board.map((word, i) => {
                const checking = phase === "checking";
                const justScored = checking && i === checkIndex - 1;
                const isSelected = !checking && selected === i;
                const isFlashing = !checking && flashIndex === i;
                let tone = "bg-card-face";
                let ink = "text-card-ink";
                if (checking && i < checkIndex) {
                  tone = "bg-chip-green";
                } else if (checking && i === wrongIndex) {
                  tone = "bg-chip-red";
                  ink = "text-cream";
                } else if (isSelected) {
                  tone = "bg-chip-gold";
                }

                return (
                  <Reorder.Item
                    key={word}
                    value={word}
                    as="li"
                    drag={!checking}
                    dragListener
                    dragElastic={0.12}
                    dragTransition={{ bounceStiffness: 500, bounceDamping: 28 }}
                    whileDrag={{
                      scale: 1.07,
                      zIndex: 30,
                      boxShadow: "0 22px 34px -8px rgba(0,0,0,0.55)",
                    }}
                    whileTap={!checking ? { scale: 0.96 } : undefined}
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
                      !checking
                        ? "hover:-translate-y-1 hover:brightness-105 cursor-grab active:cursor-grabbing"
                        : "cursor-default"
                    } ${i === wrongIndex ? "animate-shake" : ""} ${
                      isSelected
                        ? "ring-chip-gold shadow-[0_0_24px_rgba(255,203,43,0.55)] ring-4 ring-offset-2 ring-offset-felt"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-5 px-6 py-4">
                      <span className="font-display bg-chip-blue text-cream flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs [box-shadow:inset_0_2px_0_rgba(255,255,255,0.4)]">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate font-sans text-2xl font-bold">
                        {word}
                      </span>
                      {checking && i < checkIndex && (
                        <span className="font-display text-card-ink text-sm">
                          +{wordPoints(word, round)}
                        </span>
                      )}
                      {checking && i === wrongIndex && (
                        <span className="text-2xl">💥</span>
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
                  +{wordPoints(board[checkIndex - 1], round)}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={phase === "checking"}
            className="group card-base bg-chip-gold text-card-ink -skew-x-6 self-center px-10 py-3 transition-transform duration-150 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            <span className="font-display block skew-x-6 text-lg">
              ¡LISTO! ✅
            </span>
          </button>
        </motion.section>
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
              <dt className="opacity-60">Puntuación</dt>
              <dd className="font-display text-chip-red text-sm tabular-nums">
                {score}
              </dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="opacity-60">Ronda alcanzada</dt>
              <dd className="font-display text-sm tabular-nums">{round}</dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="opacity-60">Palabras acertadas</dt>
              <dd className="font-display text-sm tabular-nums">{wordsCorrect}</dd>
            </div>
          </dl>

          <p className="font-sans text-cream/60 max-w-md text-sm">
            El orden correcto era:{" "}
            <span className="text-chip-gold font-bold">
              {current.words.join(" · ")}
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={restart}
              className="card-base bg-chip-green text-card-ink -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95"
            >
              <span className="font-display block skew-x-6 text-sm">
                🔁 OTRA VEZ
              </span>
            </button>
            <Link
              href="/"
              className="card-base bg-chip-purple/90 text-cream -skew-x-6 px-7 py-3 transition-transform hover:scale-110 active:scale-95"
            >
              <span className="font-display block skew-x-6 text-sm">
                🏆 RANKING
              </span>
            </Link>
          </div>
        </motion.section>
      )}
    </main>
  );
}
