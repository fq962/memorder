import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import SettingsMenu from "./components/SettingsMenu";
import PendingRunSync from "./components/PendingRunSync";
import { SettingsProvider } from "./lib/settings";
import { AuthProvider } from "./lib/auth";
import { ProfileProvider } from "./lib/profile";
import { getThemesData } from "./lib/themes-server";
import { toThemeOption } from "./lib/themes";
import {
  BRAND,
  CREATORS,
  REPO_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_LOCALE_ALTERNATES,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
} from "./lib/site";
import "./globals.css";

// Fuente de titulares / números: pixel puro, estilo arcade.
const pressStart = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
});

// Fuente de cuerpo: pixel legible para textos largos y palabras del juego.
const pixelSans = Pixelify_Sans({
  variable: "--font-pixel-body",
  subsets: ["latin"],
});

// Barra de direcciones / status bar de iOS y Android teñidas del color del
// fieltro, para que el juego no tenga un borde blanco arriba en móvil.
export const viewport: Viewport = {
  themeColor: BRAND.felt,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // El juego se arrastra con el dedo: sin `maximumScale` el doble tap hace
  // zoom en medio de una partida. No bloqueamos `userScalable` (eso sí
  // rompería la accesibilidad), solo evitamos el zoom accidental al tocar.
  maximumScale: 5,
};

/**
 * Metadatos raíz. Los hereda toda la app; cada ruta los pisa parcialmente
 * desde su propio `layout.tsx` (ver app/play/layout.tsx y compañía).
 *
 * Las `og:image` / `twitter:image` NO se declaran acá a propósito: las
 * inyecta el archivo `opengraph-image.tsx` de cada segmento, que en Next
 * tiene prioridad sobre este objeto y además calcula solo el tamaño y el
 * tipo de la imagen.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SITE_TITLE,
    // Las rutas hijas ponen solo su nombre ("Jugar", "Ranking"…) y acá se
    // les pega la marca.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  category: "games",
  keywords: SITE_KEYWORDS,
  authors: CREATORS,
  creator: CREATORS.map((c) => c.name).join(", "),
  publisher: SITE_NAME,
  referrer: "origin-when-cross-origin",

  // Es un juego de palabras: sin esto, iOS convierte palabras que parecen
  // teléfonos o direcciones en links azules dentro del tablero.
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: SITE_LOCALE,
    alternateLocale: SITE_LOCALE_ALTERNATES,
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // El manifest (app/manifest.ts), el favicon (app/icon.ico) y el icono de
  // iOS (app/apple-icon.tsx) son convenciones de archivo: Next ya inyecta
  // sus <link> solo, declararlos acá duplicaría las etiquetas.

  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },

  appLinks: {
    web: { url: SITE_URL, should_fallback: true },
  },

  // Etiquetas sueltas que la API de Next no cubre. Las dos parejas
  // label/data son las que X (y Discord) muestran como dos columnitas
  // debajo de la descripción de la tarjeta.
  other: {
    "twitter:label1": "Idiomas",
    "twitter:data1": "Español · English",
    "twitter:label2": "Precio",
    "twitter:data2": "Gratis",
  },
};

/**
 * Datos estructurados (schema.org). Es lo que le permite a Google entender
 * que esto es un videojuego jugable en el navegador y mostrar el resultado
 * enriquecido, además de habilitar el buscador de sitio.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: ["es", "en"],
    },
    {
      "@type": "VideoGame",
      "@id": absoluteUrl("/#game"),
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: ["es", "en"],
      genre: ["Puzzle", "Memory", "Brain training", "Arcade"],
      gamePlatform: ["Web browser", "PC", "Android", "iOS"],
      playMode: "SinglePlayer",
      applicationCategory: "GameApplication",
      operatingSystem: "Any (navegador web)",
      author: CREATORS.map((creator) => ({
        "@type": "Person",
        name: creator.name,
        url: creator.url,
      })),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      sameAs: [REPO_URL],
      isPartOf: { "@id": absoluteUrl("/#website") },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Temas "de base de datos" (todo lo que no sea original/hacker/cozy): se
  // traen una vez en el build (cache: "force-cache" en el fetch, ver
  // app/lib/themes-server.ts) y su CSS ya generado se inyecta acá abajo. Un
  // tema nuevo en la tabla `themes` + un redeploy alcanza para que aparezca,
  // sin tocar código.
  const { extraThemes, css } = await getThemesData();
  const extraThemeOptions = extraThemes.map(toThemeOption);

  return (
    <html
      lang="es"
      className={`${pressStart.variable} ${pixelSans.variable} h-full antialiased`}
    >
      {/* overflow-x-clip y no -hidden: "hidden" convertiría el body en
          contenedor de scroll (y con él, en ancla de los posicionamientos de
          dentro). "clip" recorta el desborde igual sin crear scrollport. */}
      <body
        suppressHydrationWarning
        className="bg-felt text-cream relative flex min-h-full flex-col overflow-x-clip font-sans"
      >
        {/* CSS de los temas de base de datos: igual que los bloques de
            fábrica en globals.css, sin capa (@layer) para que gane siempre
            sobre las utilidades de Tailwind. Un <style> normal en cualquier
            parte del documento alcanza, no hace falta que viva en <head>. */}
        {css && <style id="db-themes" dangerouslySetInnerHTML={{ __html: css }} />}
        {/* Datos estructurados para Google. Va en el body a propósito:
            schema.org lo acepta en cualquier parte del documento y así no
            hay que pelearse con el <head> que arma Next. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Vignette + felt de fondo, detrás de todo. */}
        <div aria-hidden className="bg-felt-glow pointer-events-none fixed inset-0 -z-20" />
        {/* Scanlines CRT sutiles sobre toda la pantalla. */}
        <div aria-hidden className="scanlines pointer-events-none fixed inset-0 -z-10" />
        <SettingsProvider extraThemeOptions={extraThemeOptions}>
          <AuthProvider>
            <ProfileProvider>
              <SettingsMenu />
              <PendingRunSync />
              {children}
            </ProfileProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
