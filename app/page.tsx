const PLAYERS = [
  "haide",
  "lupita",
  "carlos",
  "mariana",
  "tono",
  "sofia",
  "beto",
  "camila",
  "diego",
  "renata",
  "pablo",
  "ximena",
  "andres",
  "valeria",
  "nico",
  "regina",
  "javi",
  "paola",
  "memo",
  "fer",
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
  "[animation-delay:120ms]",
  "[animation-delay:240ms]",
  "[animation-delay:360ms]",
  "[animation-delay:480ms]",
  "[animation-delay:600ms]",
  "[animation-delay:720ms]",
  "[animation-delay:840ms]",
];

import Link from "next/link";

// Un tono por puesto; a partir del 20 se mantiene el último.
// La opacidad baja al descender para que los renglones se fundan con el fondo.
const SHADES = [
  "bg-accent-1/55",
  "bg-accent-2/53",
  "bg-accent-3/51",
  "bg-accent-4/49",
  "bg-accent-5/47",
  "bg-accent-6/46",
  "bg-accent-7/44",
  "bg-accent-8/42",
  "bg-accent-9/40",
  "bg-accent-10/38",
  "bg-accent-11/36",
  "bg-accent-12/34",
  "bg-accent-13/32",
  "bg-accent-14/31",
  "bg-accent-15/29",
  "bg-accent-16/27",
  "bg-accent-17/25",
  "bg-accent-18/23",
  "bg-accent-19/22",
  "bg-accent-20/20",
];

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-8 py-16 md:flex-row md:items-center md:gap-12">
      {/* Halo cálido detrás de la tabla para que no choque con el fondo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 -z-10 h-[130%] w-[75%] -translate-y-1/2 bg-[radial-gradient(closest-side,var(--color-accent-1),transparent)] opacity-25 blur-3xl"
      />

      <section className="flex items-center justify-center md:w-1/3">
        <Link
          href="/play"
          className="font-display text-7xl tracking-wide text-white transition-transform hover:scale-105 sm:text-8xl md:text-9xl"
        >
          PLAY
        </Link>
      </section>

      <section className="px-4 [mask-image:linear-gradient(to_bottom,transparent,#000_3%,#000_82%,transparent)] md:max-h-[70vh] md:flex-1 md:overflow-y-auto">
        <ol className="flex flex-col gap-3">
          {ranking.map(({ rank, user, score }) => {
            // El podio agranda también sus letras al pasar el ratón.
            const zoom =
              rank <= 3 ? "transition-transform group-hover:scale-110" : "";
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
                className={`group -skew-x-12 hover:animate-row-stretch ${
                  SHADES[Math.min(SHADES.length - 1, rank - 1)]
                }`}
              >
                <div className="flex skew-x-12 items-center gap-6 px-10 py-3 text-orange-50">
                  <span
                    className={`font-display w-16 shrink-0 ${zoom} ${
                      rank === 1 ? "text-chrome text-4xl" : "text-3xl"
                    }`}
                  >
                    #{rank}
                  </span>
                  <span
                    className={`flex-1 truncate font-bold ${zoom} ${
                      rank === 1 ? "text-chrome text-2xl" : "text-xl"
                    }`}
                  >
                    {user}
                  </span>
                  <span
                    className={`font-display tabular-nums ${zoom} ${
                      rank === 1 ? "text-chrome text-3xl" : "text-2xl"
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
