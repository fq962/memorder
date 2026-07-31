-- Historial de partidas + comodines obtenidos.
--
-- Correr a mano en el SQL Editor de Supabase (este repo no tiene service
-- role key ni CLI de Supabase configurados, así que no hay forma de
-- aplicarlo automáticamente).
--
-- 1. `jokers`: lista de comodines que el jugador obtuvo durante la run,
--    en el orden en que cayeron (ver JokerId en app/lib/jokers.ts).
-- 2. `created_at`: por si la tabla no lo tenía ya; el historial ordena por
--    esta columna.
-- 3. Policy de SELECT: `fetchLeaderboard` lee por una función RPC
--    security definer, pero el historial hace un select directo filtrado
--    por user_id, y RLS lo bloquea por defecto sin esta policy.

alter table scores add column if not exists jokers jsonb not null default '[]'::jsonb;
alter table scores add column if not exists created_at timestamptz not null default now();

drop policy if exists scores_select_own on scores;
create policy scores_select_own on scores
  for select using (auth.uid() = user_id);
