# memorder

Juego web de memoria y secuencias. Memoriza el orden en el que aparecen las palabras y reconstrúyelo arrastrándolas. Un solo error termina la partida.

> **Memory Sequence** — entrena tu memoria a corto plazo mientras compites por la puntuación más alta.

## Cómo se juega

1. **Memorizar** — Las palabras se muestran una a una durante un tiempo limitado (según cantidad y longitud).
2. **Ordenar** — Las palabras se barajan; arrástralas (o tócalas en móvil) para recuperar el orden original.
3. **Comprobar** — Al pulsar *Submit*, se valida palabra por palabra. Cada acierto suma puntos; el primer fallo es *Game Over*.
4. **Progresión** — Cada ronda añade más palabras y sube la dificultad (longitud y multiplicador de puntos).

La pantalla principal (`/`) muestra un ranking de puntuaciones con animaciones de entrada. Por ahora usa datos de ejemplo; la partida en sí vive en `/play`.

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

## Banco de palabras

Las palabras están en español y se agrupan por longitud en `app/play/words.ts`:

- **Fácil** — 3–5 letras (*casa*, *lago*, *perro*…)
- **Medio** — 6–8 letras (*ventana*, *montaña*, *familia*…)
- **Difícil** — 9+ letras (*responsabilidad*, *programación*, *universidad*…)

Para ampliar el juego basta con añadir palabras a la lista correspondiente.

## Diseño

- Fondo oscuro (`#151515`) con acentos cálidos en naranja/coral.
- Tipografía display [**Luckiest Guy**](https://fonts.google.com/specimen/Luckiest+Guy) para títulos y marcador; [**Geist**](https://vercel.com/font) para el resto.
- Renglones inclinados (`skew`) con animaciones de entrada, hover y feedback al puntuar.
- Efecto *chrome* en el podio del ranking y en el título principal.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- Drag and drop nativo del navegador (`draggable` / HTML5 DnD)

## Estructura del proyecto

```
app/
├── page.tsx          # Inicio: ranking y enlace a jugar
├── play/
│   ├── page.tsx      # UI del juego (fases, drag, puntuación)
│   ├── game.ts       # Lógica: rondas, barajado, puntos
│   └── words.ts      # Banco de palabras (fácil / medio / difícil)
├── layout.tsx
└── globals.css       # Tema, colores accent-1…20 y animaciones
```

## Desarrollo

Requisitos: Node.js 20+.

```bash
npm install
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
- [ ] **Mejorar la puntuación** — revisar multiplicadores, bonificaciones y balance entre rondas.
- [x] **Migrar a otra biblioteca de drag and drop** — reemplazar el DnD nativo por una librería (p. ej. `@dnd-kit/core`) para mejor UX en móvil y animaciones al reordenar.
- [ ] **Ranking real** — persistir puntuaciones y mostrar un top global en la pantalla principal.
- [ ] **Modos de juego** — contrarreloj, práctica sin *Game Over*, dificultad manual.
- [x] **Internacionalización** — soporte para más idiomas en el banco de palabras.
- [ ] **Compartir mi resultado** — posibilidad de compartir mis resultados por whatsapp para que sea fácil la distribución del juego.
- [ ] **Agregar SEO** — Es necesario agregar bastante SEO a la página principal.
- [ ] **Mejorar visualmente el TOP** — Actualmente tiene BUGs en Mobile, además de hacerlo un poco más vivo.

## Creadores

- [@fq962](https://github.com/fq962) — Fernando Quintanilla
- [@kometha](https://github.com/kometha) — Keneth Cubas
- [@crywhat7](https://github.com/crywhat7) — Milton Barrientos
