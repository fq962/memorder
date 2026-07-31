-- Runs con semilla elegida: se guardan (historial y perfil) pero no deben
-- sumar al ranking.
--
-- Correr a mano en el SQL Editor de Supabase (mismo motivo que la
-- migración anterior: no hay service role key ni CLI configurados acá).
--
-- IMPORTANTE sobre el orden: esta migración por sí sola NO excluye las
-- runs con semilla elegida del ranking — eso lo hace leaderboard(), que
-- vive en tu Supabase y no en este repo, así que hace falta actualizarla
-- aparte (ver 0003_leaderboard_exclude_custom_seed.sql, una vez que me
-- pases su definición actual). Entre que corras ESTA migración y la de
-- leaderboard(), una run con semilla elegida y puntaje alto SÍ aparecería
-- en el ranking. Si te importa evitar esa ventana, corré ambas juntas.

alter table scores add column if not exists seed_is_custom boolean not null default false;

-- Perfil público de un jugador: sus mejores runs, oficiales y con semilla
-- propia por separado. SECURITY DEFINER por el mismo motivo que
-- leaderboard(): lee runs y el display_name de OTRO usuario, y las
-- policies de RLS (scores_select_own, profiles) solo dejan ver lo propio.
create or replace function public.user_top_runs(
  target_user uuid,
  only_custom boolean,
  max_rows integer default 5
)
returns table (
  display_name text,
  score integer,
  round_reached integer,
  words_correct integer,
  seed text,
  jokers jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.display_name,
    s.score,
    s.round_reached,
    s.words_correct,
    s.seed,
    s.jokers,
    s.created_at
  from scores s
  join profiles p on p.id = s.user_id
  where s.user_id = target_user
    and s.seed_is_custom = only_custom
  order by s.score desc
  limit max_rows;
$$;

grant execute on function public.user_top_runs(uuid, boolean, integer) to anon, authenticated;
