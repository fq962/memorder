"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
      className="animate-score-pop inline-block origin-center tabular-nums"
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
    <main className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-8 py-12 text-orange-50">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--color-accent-1),transparent)] opacity-20 blur-3xl"
      />

      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-2xl text-orange-50/60 transition-colors hover:text-orange-50"
        >
          memorder
        </Link>
        {phase !== "idle" && (
          <p className="font-display flex gap-6 text-2xl">
            <span>Ronda {round}</span>
            <CountUp value={score} />
          </p>
        )}
      </header>

      {phase === "idle" && (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <h1 className="font-display text-chrome text-6xl md:text-7xl">
            Memory Sequence
          </h1>
          <p className="max-w-md text-lg text-orange-50/70">
            Memoriza el orden en el que aparecen las palabras. Después
            reconstrúyelo arrastrándolas. Un solo error termina la partida.
          </p>
          <button
            type="button"
            onClick={() => startRound(1)}
            className="font-display -skew-x-12 bg-accent-1/60 px-10 py-4 text-4xl transition-transform hover:scale-105"
          >
            <span className="block skew-x-12">Comenzar</span>
          </button>
        </section>
      )}

      {phase === "showing" && current && (
        <section className="flex flex-1 flex-col gap-6">
          {/* Barra de tiempo: se retrae durante toda la fase de memorización. */}
          <div
            aria-hidden
            style={{ animationDuration: `${current.totalMs}ms` }}
            className="animate-time-bar fixed inset-x-0 top-0 h-1 origin-left bg-accent-1/25"
          />

          <div className="flex items-baseline justify-between">
            <p className="text-sm tracking-widest text-orange-50/50 uppercase">
              Memoriza el orden
            </p>
            <p className="font-display tabular-nums text-orange-50/50">
              {wordIndex + 1} / {current.words.length}
            </p>
          </div>

          <ol className="flex flex-col gap-3">
            {current.words.slice(0, wordIndex + 1).map((word, i) => (
              <li
                key={word}
                className="animate-row-in -skew-x-12 bg-accent-4/45"
              >
                <div className="flex skew-x-12 items-center gap-6 px-8 py-4">
                  <span className="font-display w-10 shrink-0 text-2xl text-orange-50/60">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-xl font-bold">
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
          <p className="text-center text-lg text-orange-50/70">
            {phase === "checking"
              ? "Comprobando el orden…"
              : "Arrastra las palabras al orden original —o toca una y luego otra para intercambiarlas."}
          </p>

          <div className="relative">
            <ol className="flex flex-col gap-3">
              {board.map((word, i) => {
                const checking = phase === "checking";
                const justScored = checking && i === checkIndex - 1;
                let tone = "bg-accent-4/45";
                if (checking && i < checkIndex) tone = "bg-emerald-500/45";
                else if (checking && i === wrongIndex) tone = "bg-red-500/55";
                else if (!checking && selected === i) tone = "bg-accent-1/70";

                return (
                  <li
                    key={word}
                    draggable={!checking}
                    onDragStart={() => startDrag(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={endDrag}
                    onClick={() => !checking && handleTap(i)}
                    className={`-skew-x-12 transition-colors duration-300 ${tone} ${
                      justScored ? "animate-row-flash" : ""
                    } ${
                      checking
                        ? "cursor-default"
                        : "cursor-grab active:cursor-grabbing"
                    } ${dragIndex === i ? "opacity-40" : ""}`}
                  >
                    <div className="flex skew-x-12 items-center gap-6 px-8 py-4">
                      <span className="font-display w-10 shrink-0 text-2xl text-orange-50/60">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-xl font-bold">
                        {word}
                      </span>
                      {checking && i < checkIndex && (
                        <span className="font-display text-xl text-emerald-100">
                          +{wordPoints(word, round)}
                        </span>
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
                <span className="font-display text-chrome text-7xl md:text-8xl">
                  +{wordPoints(board[checkIndex - 1], round)}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={phase === "checking"}
            className="font-display -skew-x-12 self-center bg-accent-1/60 px-10 py-3 text-3xl transition-transform hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
          >
            <span className="block skew-x-12">Submit</span>
          </button>
        </section>
      )}

      {phase === "gameover" && current && (
        <section className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <h1 className="font-display text-chrome text-6xl md:text-7xl">
            Game Over
          </h1>

          <dl className="flex flex-col gap-2 text-xl">
            <div className="flex justify-between gap-10">
              <dt className="text-orange-50/60">Puntuación</dt>
              <dd className="font-display tabular-nums">{score}</dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="text-orange-50/60">Ronda alcanzada</dt>
              <dd className="font-display tabular-nums">{round}</dd>
            </div>
            <div className="flex justify-between gap-10">
              <dt className="text-orange-50/60">Palabras acertadas</dt>
              <dd className="font-display tabular-nums">{wordsCorrect}</dd>
            </div>
          </dl>

          <p className="text-orange-50/60">
            El orden correcto era: {current.words.join(" · ")}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={restart}
              className="font-display -skew-x-12 bg-accent-1/60 px-8 py-3 text-2xl transition-transform hover:scale-105"
            >
              <span className="block skew-x-12">Jugar de nuevo</span>
            </button>
            <Link
              href="/"
              className="font-display -skew-x-12 bg-accent-10/30 px-8 py-3 text-2xl transition-transform hover:scale-105"
            >
              <span className="block skew-x-12">Ver ranking</span>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
