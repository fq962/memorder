"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import EmojiRain from "../components/EmojiRain";
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
  const [wordIndex, setWordIndex] = useState(0);
  const [board, setBoard] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // Palabras ya comprobadas como correctas y posición del primer fallo.
  const [checkIndex, setCheckIndex] = useState(0);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  // Dispara la sacudida de pantalla al fallar.
  const [shake, setShake] = useState(false);

  // Palabras de las últimas 5 rondas, para no repetirlas.
  const recentRef = useRef<string[][]>([]);
  // El índice arrastrado se guarda en una ref: el estado sirve solo para el
  // resaltado y podría no estar aplicado todavía cuando llega el drop.
  const dragRef = useRef<number | null>(null);

  const startRound = useCallback((next: number) => {
    const generated = buildRound(next, recentRef.current.flat());
    recentRef.current = [generated.words, ...recentRef.current].slice(0, 5);
    setCurrent(generated);
    setWordIndex(0);
    setSelected(null);
    setDragIndex(null);
    setCheckIndex(0);
    setWrongIndex(null);
    setPhase("showing");
  }, []);

  // Muestra las palabras una a una y al terminar pasa a la fase de ordenar.
  useEffect(() => {
    if (phase !== "showing" || !current) return;

    const isLast = wordIndex >= current.words.length - 1;
    const timer = setTimeout(() => {
      if (isLast) {
        setBoard(shuffleDistinct(current.words));
        setPhase("arrange");
      } else {
        setWordIndex((i) => i + 1);
      }
    }, current.perWordMs);
    return () => clearTimeout(timer);
  }, [phase, current, wordIndex]);

  function startDrag(index: number) {
    dragRef.current = index;
    setDragIndex(index);
  }

  function endDrag() {
    dragRef.current = null;
    setDragIndex(null);
  }

  function handleDrop(target: number) {
    const from = dragRef.current;
    endDrag();
    if (from === null || from === target) return;
    setBoard((b) => move(b, from, target));
  }

  function handleTap(index: number) {
    if (selected === null) {
      setSelected(index);
      return;
    }
    if (selected !== index) setBoard((b) => move(b, selected, index));
    setSelected(null);
  }

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
        setScore((s) => s + perfectBonus(current.words, round));
        const next = round + 1;
        setRound(next);
        startRound(next);
        return;
      }

      if (board[checkIndex] === current.words[checkIndex]) {
        setScore((s) => s + wordPoints(board[checkIndex], round));
        setWordsCorrect((c) => c + 1);
        setCheckIndex((i) => i + 1);
      } else {
        setWrongIndex(checkIndex);
        // Sacudida al fallar.
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
      <EmojiRain count={12} />

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
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <h1 className="font-display text-chrome animate-bob text-3xl sm:text-5xl">
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
            onClick={() => startRound(1)}
            className="group card-base bg-chip-green animate-bob text-card-ink -rotate-2 px-10 py-5 transition-transform duration-150 hover:-rotate-1 hover:scale-110 hover:brightness-110 active:scale-95"
          >
            <span className="font-display block text-2xl [text-shadow:2px_2px_0_rgba(0,0,0,0.35)]">
              ▶ COMENZAR
            </span>
          </button>
        </section>
      )}

      {phase === "showing" && current && (
        <section className="flex flex-1 flex-col gap-6">
          {/* Barra de tiempo: se retrae durante toda la fase de memorización. */}
          <div
            aria-hidden
            style={{ animationDuration: `${current.totalMs}ms` }}
            className="animate-time-bar bg-chip-gold fixed inset-x-0 top-0 z-30 h-1.5 origin-left shadow-[0_0_12px_rgba(255,203,43,0.8)]"
          />

          <div className="flex items-baseline justify-between">
            <p className="font-display text-chip-gold text-[10px] tracking-widest">
              MEMORIZA EL ORDEN 👀
            </p>
            <p className="font-display text-cream/50 text-xs tabular-nums">
              {wordIndex + 1} / {current.words.length}
            </p>
          </div>

          <ol className="flex flex-col gap-3">
            {current.words.slice(0, wordIndex + 1).map((word, i) => (
              <li
                key={word}
                style={{ "--tilt": tiltFor(i) } as React.CSSProperties}
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
        </section>
      )}

      {(phase === "arrange" || phase === "checking") && current && (
        <section className="flex flex-1 flex-col gap-6">
          <p className="font-sans text-cream/70 text-center text-base">
            {phase === "checking"
              ? "Comprobando el orden… 🎰"
              : "Arrástralas al orden original — o toca una y luego otra para intercambiarlas. 🃏"}
          </p>

          <div className="relative">
            <ol className="flex flex-col gap-3">
              {board.map((word, i) => {
                const checking = phase === "checking";
                const justScored = checking && i === checkIndex - 1;
                let tone = "bg-card-face";
                let ink = "text-card-ink";
                if (checking && i < checkIndex) {
                  tone = "bg-chip-green";
                } else if (checking && i === wrongIndex) {
                  tone = "bg-chip-red";
                  ink = "text-cream";
                } else if (!checking && selected === i) {
                  tone = "bg-chip-gold";
                }

                return (
                  <li
                    key={word}
                    draggable={!checking}
                    onDragStart={() => startDrag(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={endDrag}
                    onClick={() => !checking && handleTap(i)}
                    style={{ "--tilt": tiltFor(i) } as React.CSSProperties}
                    className={`card-base transition-colors duration-300 ${tone} ${ink} ${
                      justScored ? "animate-row-flash" : ""
                    } ${
                      !checking
                        ? "hover:-translate-y-1 hover:brightness-105 cursor-grab active:cursor-grabbing active:scale-105"
                        : "cursor-default"
                    } ${
                      i === wrongIndex ? "animate-shake" : ""
                    } ${dragIndex === i ? "scale-105 opacity-50" : ""}`}
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
                  </li>
                );
              })}
            </ol>

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
        </section>
      )}

      {phase === "gameover" && current && (
        <section className="animate-pop-in flex flex-1 flex-col items-center justify-center gap-7 text-center">
          <div className="text-6xl">💀</div>
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
        </section>
      )}
    </main>
  );
}
