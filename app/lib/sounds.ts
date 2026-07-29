// Gestor de sonidos con Web Audio API.
//
// La data de cada mp3 se descarga y se DECODIFICA a AudioBuffer una sola vez,
// al abrir el juego. A partir de ahí reproducir es instantáneo: solo se crea
// un BufferSource sobre el buffer ya decodificado, sin peticiones de red.

export type SoundName =
  | "game-start"
  | "correct-word"
  | "correct-round"
  | "gameover";

const NAMES: SoundName[] = [
  "game-start",
  "correct-word",
  "correct-round",
  "gameover",
];

let ctx: AudioContext | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let loading: Promise<void> | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new AC();
  }
  return ctx;
}

/**
 * Descarga y decodifica todos los sonidos una vez. Idempotente: si ya se está
 * cargando o ya se cargó, devuelve la misma promesa / no hace nada.
 */
export function preloadSounds(): Promise<void> {
  if (loading) return loading;
  const audioCtx = getCtx();
  if (!audioCtx) return Promise.resolve();

  loading = Promise.all(
    NAMES.map(async (name) => {
      if (buffers.has(name)) return;
      const res = await fetch(`/audio/${name}.mp3`);
      const data = await res.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(data);
      buffers.set(name, buffer);
    }),
  ).then(() => undefined);

  return loading;
}

/**
 * Reanuda el contexto (necesario tras un gesto del usuario por la política de
 * autoplay). Llamar en el primer click, p. ej. al pulsar COMENZAR.
 */
export function unlockAudio() {
  const audioCtx = getCtx();
  if (audioCtx && audioCtx.state === "suspended") void audioCtx.resume();
}

/**
 * Reproduce un sonido ya decodificado. Inmediato, sin red.
 * @param rate  velocidad/tono (1 = normal). Útil para el efecto escalera.
 */
export function playSound(
  name: SoundName,
  { rate = 1, volume = 1 }: { rate?: number; volume?: number } = {},
) {
  const audioCtx = getCtx();
  const buffer = buffers.get(name);
  if (!audioCtx || !buffer) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = rate;

  const gain = audioCtx.createGain();
  gain.gain.value = volume;

  src.connect(gain).connect(audioCtx.destination);
  src.start();
}

/**
 * Blip sintetizado (sin archivo) para feedback instantáneo de teclado:
 * mover el cursor o soltar una palabra en su casilla.
 */
export function playTick(freq = 880) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") void audioCtx.resume();

  const osc = audioCtx.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.06;
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.08,
  );

  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}
