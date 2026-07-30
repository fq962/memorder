// Cliente de Supabase (browser-only, flujo PKCE). Todo el juego es client-side
// y no hay contenido server-rendered que dependa de la sesión, así que no
// hace falta @supabase/ssr ni un Route Handler: el intercambio del código de
// OAuth se hace a mano en app/lib/auth.tsx.
//
// Si faltan las env vars (p. ej. antes de configurar .env.local) exporta
// null en vez de tirar el build, para que el resto de la app siga andando.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { flowType: "pkce", detectSessionInUrl: false },
      })
    : null;
