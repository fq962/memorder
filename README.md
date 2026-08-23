# MEMORDER

**Memoriza el orden. Un solo error y game over.**

Juego web de memoria y secuencias: memoriza el orden en el que aparecen las palabras y reconstrúyelo arrastrándolas. Cada ronda suma palabras, sube la dificultad y reparte comodines. Un solo error termina la partida.

🎮 **[Jugar ahora →](https://memorder.vercel.app)**

> Gratis, sin instalar, en español e inglés, con ranking global.

---

## Cómo se juega

1. **Memorizar** — Las palabras se muestran una a una durante un tiempo limitado (según cantidad y longitud).
2. **Ordenar** — Las palabras se barajan; arrástralas (o tócalas en móvil) para recuperar el orden original.
3. **Comprobar** — Al pulsar *Submit*, se valida palabra por palabra. Cada acierto suma puntos; el primer fallo es *Game Over*.
4. **Progresión** — Cada ronda añade más palabras y sube la dificultad (longitud y multiplicador de puntos).

La pantalla principal (`/`) muestra el ranking global real; la partida vive en `/play`, tu historial en `/history` y el perfil de cualquier jugador en `/profile/[userId]`.

## Controles

| Plataforma | Acción |
|---|---|
| Escritorio | Arrastra una palabra y suéltala sobre otra para intercambiar posiciones |
| Móvil / táctil | Toca una palabra y luego otra para intercambiarlas |
| Ambas | Pulsa **Submit** cuando creas que el orden es correcto |

## Progresión de rondas

| Ronda | Palabras | Dificultad de palabras |
|:---:|:---:|:---|
| 1 | 3 | fácil |
| 2 | 4 | fácil |
| 3 | 5 | fácil + medio |
| 4–5 | 5 | medio |
| 6 | 6 | medio + difícil |
| 7–8 | 7–8 | difícil |
| 9 | 10 | todas |
| 10+ | +1 cada 2 rondas (máx. 15) | todas |

**Tiempo de memorización:** `1 s × palabra + 0.15 s × letra promedio`. Una barra en la parte superior de la pantalla indica cuánto queda.

**Anti-repetición:** no se repiten palabras de las últimas 5 rondas, salvo que el banco se quede corto.

## Sistema de puntuación

Cada palabra acertada suma:

```
(10 + bonus por longitud) × multiplicador de ronda
```

| Longitud de palabra | Bonus |
|:---:|:---:|
| ≤ 5 letras | +0 |
| 6–8 letras | +5 |
| 9–11 letras | +10 |
| 12+ letras | +15 |

**Multiplicadores por ronda:** `1.0 → 1.2 → 1.4 → 1.6 → 1.8 → 2.0 → 2.3 → 2.6 → 3.0 → 3.5` (desde la ronda 10 en adelante).

**Bonus Perfect:** si acertás todas las palabras de una ronda, sumás un **25% extra** sobre el total de esa ronda.

Al comprobar, cada palabra correcta se resalta en verde y muestra los puntos ganados; la primera incorrecta se marca en rojo y termina la partida.

## Semillas

Cada partida se genera a partir de una semilla (`pure-rand`): misma semilla, mismas palabras y mismos comodines. Se puede pegar la semilla de otra partida en `/play` para jugar exactamente la misma run y comparar puntajes.

## Banco de palabras

Las palabras viven en `app/play/words.ts`, agrupadas por longitud y por idioma (~2.5k en español y ~2.5k en inglés):

- **Fácil** — 3–5 letras (*casa*, *lago*, *perro*…)
- **Medio** — 6–8 letras (*ventana*, *montaña*, *familia*…)
- **Difícil** — 9+ letras (*responsabilidad*, *programación*, *universidad*…)

Para ampliar el juego basta con añadir palabras a la lista correspondiente.

## Temas

Los temas visuales se leen de la tabla `themes` de Supabase y su CSS se genera e inyecta en el build (`app/lib/themes-server.ts`). **Agregar un tema es insertar una fila y hacer un redeploy**, sin tocar código. `/theme-lab` es el editor interno para armar la paleta y copiar la fila.

## SEO y compartibilidad

Todo el SEO sale de un solo archivo de constantes: [`app/lib/site.ts`](app/lib/site.ts) (dominio, título, descripción, keywords, autores, paleta). Si cambia el dominio o el copy, se toca ahí y nada más.

| Qué | Dónde | Qué genera |
|---|---|---|
| Metadatos raíz | `app/layout.tsx` | `title` con plantilla, `description`, keywords, autores, canonical, `robots`, `appleWebApp`, `appLinks` |
| Open Graph | `app/layout.tsx` + `app/*/opengraph-image.tsx` | `og:title`, `og:description`, `og:url`, `og:site_name`, `og:type`, `og:locale` (+ `og:locale:alternate`), `og:image` con `width`/`height`/`type`/`alt` |
| X / Twitter | `app/layout.tsx` + `app/twitter-image.tsx` | `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image` (+ `alt`, `width`, `height`) y las columnitas `twitter:label1/data1` y `label2/data2` |
| Datos estructurados | `app/layout.tsx` (JSON-LD) | `WebSite` + `VideoGame` de schema.org: género, plataformas, autores y `Offer` a precio 0 |
| Imágenes sociales | `app/lib/og.tsx` | PNG 1200×630 dibujados con `next/og` (fieltro, título cromado y cartas), una por ruta |
| Iconos | `app/apple-icon.tsx`, `app/pwa-icon/[size]/route.tsx` | `apple-touch-icon` 180×180 y los PNG 192/512 del manifest |
| PWA | `app/manifest.ts` | `/manifest.webmanifest` instalable, con `shortcuts` a Jugar e Historial |
| Rastreo | `app/robots.ts`, `app/sitemap.ts` | `/robots.txt` y `/sitemap.xml` |
| Viewport | `app/layout.tsx` (`export const viewport`) | `theme-color`, `color-scheme: dark` |

Las tarjetas sociales se pueden previsualizar directo en el navegador: `/opengraph-image`, `/play/opengraph-image`, `/pwa-icon/512`.

**Qué queda fuera del índice, a propósito:** `/theme-lab` (herramienta interna), `/history` (contenido privado) y `/profile/[userId]` (URLs con UUID). Los perfiles igual conservan metadatos sociales completos, para que el link se vea bien al compartirlo.

La fuente pixel de las imágenes (`public/fonts/press-start-2p.woff`) está versionada en el repo a propósito: Satori solo entiende `ttf`/`otf`/`woff` (no `woff2`) y así el build no depende de bajar nada de Google Fonts.

### Antes de publicar

- [ ] Poner el dominio real en `NEXT_PUBLIC_SITE_URL` (si no, se asume `https://memorder.vercel.app`).
- [ ] Dar de alta el sitio en [Google Search Console](https://search.google.com/search-console) y enviar `/sitemap.xml`.
- [ ] Si se verifica por meta tag, agregar el código en `metadata.verification` de `app/layout.tsx`.
- [ ] Revisar cómo se ven las tarjetas con el [Sharing Debugger de Facebook](https://developers.facebook.com/tools/debug/) y el [Card Validator de X](https://cards-dev.twitter.com/validator).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/) para el reordenamiento y las animaciones
- [Supabase](https://supabase.com/) — auth con Google, ranking, historial y temas
- [`next/og`](https://nextjs.org/docs/app/api-reference/functions/image-response) para las imágenes sociales
- [`pure-rand`](https://github.com/dubzzz/pure-rand) para las partidas con semilla

## Estructura del proyecto

```
app/
├── page.tsx                     # Inicio: ranking global y botón de jugar
├── layout.tsx                   # Metadatos, JSON-LD, providers y temas
├── globals.css                  # Tema, colores accent-1…20 y animaciones
├── opengraph-image.tsx          # Tarjeta social de la home
├── twitter-image.tsx            # Reexporta la de arriba para X
├── apple-icon.tsx               # Icono de iOS (180×180)
├── manifest.ts                  # /manifest.webmanifest (PWA)
├── robots.ts                    # /robots.txt
├── sitemap.ts                   # /sitemap.xml
├── pwa-icon/[size]/route.tsx    # Iconos PNG 192/512 del manifest
├── play/
│   ├── page.tsx                 # UI del juego (fases, drag, puntuación)
│   ├── layout.tsx               # Metadatos de /play
│   ├── opengraph-image.tsx      # Tarjeta social de /play
│   ├── game.ts                  # Lógica: rondas, barajado, puntos
│   └── words.ts                 # Banco de palabras (ES / EN)
├── history/                     # Historial del usuario logueado
├── profile/[userId]/            # Perfil público de un jugador
├── theme-lab/                   # Editor interno de temas
├── components/                  # Comodines, HUD, auth, compartir…
└── lib/
    ├── site.ts                  # Constantes de marca y SEO
    ├── og.tsx                   # Fábrica de imágenes sociales e iconos
    ├── scores.ts                # Ranking, historial y perfiles
    ├── jokers.ts                # Comodines
    ├── themes*.ts               # Temas (cliente / servidor / motor)
    └── i18n.ts                  # Traducciones de la interfaz (ES/EN)
supabase/migrations/             # Esquema: runs, perfiles, temas
```

## Desarrollo

Requisitos: Node.js 20+.

```bash
npm install
```

Copiá `env.example` a `.env.local` y completá las variables:

| Variable | Obligatoria | Para qué |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sí | Auth, ranking, historial y temas |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sí | Idem |
| `NEXT_PUBLIC_SITE_URL` | no | Dominio público para canonical, sitemap y OG. Por defecto `https://memorder.vercel.app` |

Sin las variables de Supabase la app sigue arrancando: el cliente exporta `null` y el juego funciona sin login ni ranking.

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

## TODO

- [x] **Agregar sonidos** — feedback al mostrar palabras, acertar, fallar y *Game Over*.
- [x] **Mejorar la puntuación** — revisar multiplicadores, bonificaciones y balance entre rondas.
- [x] **Migrar a otra biblioteca de drag and drop** — reemplazar el DnD nativo por una librería para mejor UX en móvil y animaciones al reordenar.
- [x] **Ranking real** — persistir puntuaciones y mostrar un top global en la pantalla principal.
- [ ] **Modos de juego** — contrarreloj, práctica sin *Game Over*, dificultad manual.
- [x] **Internacionalización** — soporte para más idiomas en el banco de palabras.
- [x] **Compartir mi resultado** — compartir la tarjeta de resultado por WhatsApp para que sea fácil la distribución del juego.
- [x] **Agregar SEO** — metadatos completos, Open Graph y Twitter Cards con imágenes generadas, JSON-LD, `robots.txt`, `sitemap.xml` y manifest PWA.
- [ ] **Mejorar visualmente el TOP** — Actualmente tiene BUGs en Mobile, además de hacerlo un poco más vivo.
- [x] **ThemeLab** — Un editor de temas para los devs.
- [x] **Más palabras** — Agregar 5000 palabras, 2.5k en español y 2.5k en inglés.
- [x] **Selector de comodines** — Pueden aparecer más de 1 comodín y seleccionar uno.
- [ ] **URLs por idioma** — rutas `/es` y `/en` para poder declarar `hreflang` y que cada idioma se indexe por separado.

## Creadores

- [@fq962](https://github.com/fq962) — Fernando Quintanilla
- [@kometha](https://github.com/kometha) — Keneth Cubas
- [@crywhat7](https://github.com/crywhat7) — Milton Barrientos
