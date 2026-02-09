import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Completely skip ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      {
        source: '/downloads',
        destination: '/download',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.licdn.com',
      },
    ],
  },
};

export default nextConfig;
