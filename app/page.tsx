import Link from "next/link";
import Image from "next/image";
import cerebri from "./images/cerebri.png";

const PLAYERS = [
  "haide", "lupita", "carlos", "mariana", "tono", "sofia", "beto", "camila",
  "diego", "renata", "pablo", "ximena", "andres", "valeria", "nico", "regina",
  "javi", "paola", "memo", "fer",
];

const ranking = Array.from({ length: 100 }, (_, i) => {
  const round = Math.floor(i / PLAYERS.length);
  return {
    rank: i + 1,
    user: round === 0 ? PLAYERS[i] : `${PLAYERS[i % PLAYERS.length]}${round + 1}`,
    score: 9840 - i * 87,
  };
});

// Los renglones entran de abajo hacia arriba: el último sale primero y el #1 al final.
// Las clases deben ser literales para que Tailwind las genere.
const STAGGER = [
  "[animation-delay:0ms]",
  "[animation-delay:110ms]",
  "[animation-delay:220ms]",
  "[animation-delay:330ms]",
  "[animation-delay:440ms]",
  "[animation-delay:550ms]",
  "[animation-delay:660ms]",
  "[animation-delay:770ms]",
];

// Un tono por puesto; a partir del 20 se mantiene el último.
// La opacidad baja al descender para que los renglones se fundan con el fondo.
const SHADES = [
  "bg-accent-1/85", "bg-accent-2/82", "bg-accent-3/79", "bg-accent-4/76",
  "bg-accent-5/73", "bg-accent-6/70", "bg-accent-7/67", "bg-accent-8/64",
  "bg-accent-9/61", "bg-accent-10/58", "bg-accent-11/55", "bg-accent-12/52",
  "bg-accent-13/49", "bg-accent-14/46", "bg-accent-15/43", "bg-accent-16/40",
  "bg-accent-17/37", "bg-accent-18/34", "bg-accent-19/31", "bg-accent-20/28",
];

// Medallas para el podio.
const MEDALS = ["🥇", "🥈", "🥉"];

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-6 py-14 md:flex-row md:items-center md:gap-10">
      {/* ---- Panel izquierdo: título + botón PLAY ---- */}
      <section className="flex flex-col items-center justify-center gap-6 text-center md:w-[42%]">
        {/* Mascota: cerebro animado, flotando. */}
        <Image
          src={cerebri}
          alt="Cerebri, la mascota"
          priority
          className="animate-float w-56 max-w-full drop-shadow-[0_10px_25px_rgba(255,95,200,0.35)] sm:w-64"
        />

        <div className="flex flex-col items-center gap-1">
          <h1 className="font-display text-chrome text-4xl leading-tight sm:text-5xl">
            MEM
            <br />
            ORDER
          </h1>
          <p className="font-display text-cream/50 mt-3 text-[10px] tracking-widest">
            memoriza · o llora 🧠
          </p>
        </div>

        <Link
          href="/play"
          className="group animate-bob card-base bg-chip-red relative inline-block -rotate-2 px-12 py-6 transition-transform duration-150 hover:-rotate-1 hover:scale-110 hover:brightness-110 active:scale-95"
        >
          <span className="font-display text-cream block text-3xl [text-shadow:3px_3px_0_rgba(0,0,0,0.55)] sm:text-4xl">
            ▶ PLAY
          </span>
          <span className="absolute -top-3 -right-3 animate-spin text-2xl [animation-duration:6s]">
            ⭐
          </span>
        </Link>

        <p className="font-sans text-cream/60 max-w-xs text-sm">
          Memoriza el orden de las palabras y reconstrúyelo. Un error y{" "}
          <span className="text-chip-red font-bold">boom 💥</span>.
        </p>
      </section>

      {/* ---- Panel derecho: ranking en cartas ---- */}
      <section className="px-2 [mask-image:linear-gradient(to_bottom,transparent,#000_4%,#000_84%,transparent)] md:max-h-[78vh] md:flex-1 md:overflow-y-auto">
        <p className="font-display text-chip-gold mb-4 text-center text-sm tracking-widest [text-shadow:2px_2px_0_rgba(0,0,0,0.5)]">
          🏆 TOP CEREBROS 🏆
        </p>
        <ol className="flex flex-col gap-2.5">
          {ranking.map(({ rank, user, score }) => {
            const zoom = rank <= 3 ? "transition-transform group-hover:scale-110" : "";
            const medal = rank <= 3 ? MEDALS[rank - 1] : null;
            return (
              <li
                key={rank}
                className={`animate-row-in motion-reduce:animate-none ${
                  rank <= STAGGER.length ? STAGGER[STAGGER.length - rank] : STAGGER[0]
                }`}
              >
                {/* La entrada y el hover van en elementos distintos: si compartieran
                    la propiedad animation, salir del hover relanzaría la entrada. */}
                <div
                  className={`group card-base -skew-x-6 hover:animate-row-stretch ${
                    SHADES[Math.min(SHADES.length - 1, rank - 1)]
                  } ${rank === 1 ? "ring-2 ring-white/60" : ""}`}
                >
                  <div className="text-card-ink flex skew-x-6 items-center gap-4 px-6 py-2.5">
                    <span
                      className={`font-display w-14 shrink-0 ${zoom} ${
                        rank === 1 ? "text-lg" : "text-sm"
                      }`}
                    >
                      {medal ?? `#${rank}`}
                    </span>
                    <span
                      className={`flex-1 truncate font-sans font-bold ${zoom} ${
                        rank === 1 ? "text-2xl" : "text-lg"
                      }`}
                    >
                      {user}
                    </span>
                    <span
                      className={`font-display tabular-nums ${zoom} ${
                        rank === 1 ? "text-base" : "text-xs"
                      }`}
                    >
                      {score}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
