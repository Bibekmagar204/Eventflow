import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Images from external sources (e.g. QR codes, event images)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
}

export default nextConfig
