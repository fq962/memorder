"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import { saveScore } from "../lib/scores";
import { clearPendingRun, loadPendingRun } from "../lib/pendingRun";

/**
 * Sin UI: vive montado en el layout raíz para recoger la run que haya
 * quedado pendiente en localStorage (ver app/lib/pendingRun.ts) apenas el
 * usuario tenga sesión, sin importar en qué página haya terminado el
 * redirect de OAuth.
 */
export default function PendingRunSync() {
  const { user } = useAuth();
  const flushedRef = useRef(false);

  useEffect(() => {
    if (!user || flushedRef.current) return;

    const pending = loadPendingRun();
    if (!pending) return;

    flushedRef.current = true;
    void saveScore(user.id, pending).then((ok) => {
      if (ok) clearPendingRun();
    });
  }, [user]);

  return null;
}
