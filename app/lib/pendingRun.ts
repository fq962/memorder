// Puente para guardar una run jugada sin sesión, en caso de que el jugador
// se loguee justo después de perder.
//
// El login real es un redirect completo a Google y de vuelta (ver
// signInWithGoogle en app/lib/auth.tsx): la navegación destruye el estado de
// React de /play, así que la única forma de que la partida sobreviva es
// dejarla en localStorage ANTES de que el jugador haga clic en loguearse, y
// leerla desde donde sea que el redirect termine aterrizando (ver
// app/components/PendingRunSync.tsx, montado en el layout raíz).
//
// Sin React a propósito, mismo estilo que scores.ts.
import type { Run } from "./scores";

const KEY = "memorder:pending-run";

export function savePendingRun(run: Run): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    // Storage lleno o inaccesible (modo privado, etc.): la partida ya se
    // jugó y no hay ranking sin sesión, así que no hay nada más que hacer.
  }
}

export function loadPendingRun(): Run | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Run;
  } catch {
    return null;
  }
}

export function clearPendingRun(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar si no se pudo ni leer.
  }
}
