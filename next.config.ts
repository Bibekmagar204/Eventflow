import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Images from external sources (e.g. QR codes, event images, Unsplash placeholders)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
}

export default nextConfig
