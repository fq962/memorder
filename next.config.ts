import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatares de Google (login con Supabase Auth).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // /share-card dibuja la tarjeta de resultado a pedido y para eso lee del
  // disco la fuente pixel y las cartas de comodín. Al ser rutas dinámicas,
  // Next no puede deducir esos archivos del código (los paths se arman en
  // tiempo de ejecución), así que hay que decirle explícitamente que los
  // meta en el bundle del servidor. Sin esto anda en local y falla en
  // producción, que es el peor de los casos.
  outputFileTracingIncludes: {
    "/share-card": ["./public/fonts/**", "./public/cards/share/**"],
  },
};

export default nextConfig;
