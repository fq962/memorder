"use client";

import { useEffect, useState } from "react";

const EMOJIS = ["🧠", "💥", "🔥", "✨", "🤯", "👾", "⭐", "🎰", "💫", "🌀", "🃏", "💎"];

type Bit = {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

/**
 * Lluvia de emojis flotando hacia arriba, de fondo. Puro adorno "brainrot".
 * Se generan solo en el cliente (usan Math.random) para no romper la hidratación.
 */
export default function EmojiRain({ count = 18 }: { count?: number }) {
  const [bits, setBits] = useState<Bit[]>([]);

  useEffect(() => {
    setBits(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: EMOJIS[i % EMOJIS.length],
        left: Math.random() * 100,
        delay: Math.random() * 14,
        duration: 12 + Math.random() * 12,
        size: 16 + Math.random() * 26,
      })),
    );
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute bottom-0 motion-reduce:hidden"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animation: `drift ${b.duration}s linear ${b.delay}s infinite`,
          }}
        >
          {b.emoji}
        </span>
      ))}
    </div>
  );
}
