-- Temas de la app, en base de datos: agregar uno nuevo es un insert acá + un
-- redeploy (el build los trae con fetch({cache:'force-cache'}), ver
-- app/lib/themes-server.ts), sin tocar código ni CSS.
--
-- Correr a mano en el SQL Editor de Supabase (mismo motivo que las
-- migraciones anteriores: este repo no tiene service role key ni CLI de
-- Supabase configurados, así que no hay forma de aplicarlo automáticamente).
--
-- Cada fila define solo los 10 colores "núcleo" de un tema (paleta de chips
-- + fondo + tarjeta); el degradado del título, el brillo de fondo y la
-- escala de 20 tonos del ranking se calculan a partir de esos 10 en
-- app/lib/theme-engine.ts, así que no hace falta escribir a mano cada
-- variable CSS. Para armar el INSERT sin pelearse con SQL, entrá a la ruta
-- oculta /theme-lab: elegís los 10 colores con un color picker, ves la
-- previsualización en vivo, y copiás el INSERT ya armado.
--
-- `enabled`: una fila con enabled = false sigue en la tabla pero no se
-- muestra ni se trae en el próximo build — para probar un tema sin
-- publicarlo, o para retirarlo sin borrar la fila.

create table if not exists themes (
  id text primary key,
  label text not null,
  felt text not null,
  cream text not null,
  chip_red text not null,
  chip_blue text not null,
  chip_gold text not null,
  chip_green text not null,
  chip_purple text not null,
  chip_pink text not null,
  card_face text not null,
  card_ink text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table themes enable row level security;

-- Público de lectura a propósito: son solo colores, no hay nada sensible, y
-- el build (sin sesión) necesita poder leerlos con la anon key.
drop policy if exists themes_select_all on themes;
create policy themes_select_all on themes
  for select using (true);

-- Semilla: el tema pedido en este cambio. Los valores son un punto de
-- partida razonable (rojo/azul arácnido sobre fondo casi negro) — ajustalos
-- desde /theme-lab si no convencen y volvé a correr el insert.
insert into themes (
  id, label, felt, cream,
  chip_red, chip_blue, chip_gold, chip_green, chip_purple, chip_pink,
  card_face, card_ink, sort_order
) values (
  'spiderman', 'Spider-Man', '#0c0f1a', '#f2ece0',
  '#e0262f', '#2f6fe0', '#ffb100', '#39e07a', '#7c5cff', '#ff4fa3',
  '#f2e9da', '#12182b', 10
)
on conflict (id) do nothing;
