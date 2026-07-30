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
};

export default nextConfig;
