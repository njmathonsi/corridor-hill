import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Supabase storage images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
