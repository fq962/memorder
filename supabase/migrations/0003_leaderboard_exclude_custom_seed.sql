-- Excluye las runs con semilla elegida del ranking.
--
-- Correr a mano en el SQL Editor de Supabase, DESPUÉS de
-- 0002_seed_is_custom_and_profiles.sql (esta usa la columna seed_is_custom
-- que esa migración agrega).
--
-- Reconstruida a partir de la consulta que el usuario pegó (pg_get_functiondef
-- de la leaderboard() actual): se preserva la lógica tal cual —"mejor score
-- por usuario, con empate resuelto por la fecha más vieja, top N con
-- max_rows clamped entre 1 y 500"— y se agrega UNA sola línea: el "where not
-- s.seed_is_custom" dentro de la subquery que calcula el mejor score de cada
-- usuario. Si algún usuario solo tiene runs con semilla elegida, no aparece
-- en el ranking (no tiene "mejor score oficial" que mostrar), que es
-- exactamente lo que se busca.
--
-- Si el wrapper real de la función (tipos exactos, default de max_rows,
-- language/security definer) difiere de lo reconstruido acá, avisar para
-- ajustar — la parte que importa, 100% preservada, es el SELECT en sí.

create or replace function public.leaderboard(max_rows integer default null)
returns table (
  user_id uuid,
  display_name text,
  score integer,
  seed text,
  achieved_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select best.user_id, best.display_name, best.score, best.seed, best.achieved_at
    from (
      select distinct on (s.user_id)
             s.user_id,
             p.display_name,
             s.score,
             s.seed,
             s.created_at as achieved_at
        from public.scores s
        join public.profiles p on p.id = s.user_id
       where not s.seed_is_custom
       order by s.user_id, s.score desc, s.created_at asc
    ) best
   order by best.score desc, best.achieved_at asc
   limit greatest(1, least(coalesce(max_rows, 100), 500));
$$;
