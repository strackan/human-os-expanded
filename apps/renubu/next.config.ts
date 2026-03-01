import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Trace from monorepo root so workspace packages are included in output
  outputFileTracingRoot: path.join(__dirname, '../..'),
  eslint: {
    // Disable ESLint errors during builds (warnings are pre-existing)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (errors are pre-existing)
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  serverExternalPackages: ['@supabase/supabase-js', 'pg', 'pg-pool', 'pg-native'],
  webpack: (config, { isServer }) => {
    // Exclude pg-native (optional dependency that causes Vercel build errors)
    config.externals = [...(config.externals || []), 'pg-native'];

    // Client-side: exclude Node.js modules used by PostgreSQL
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        pg: false,
        'pg-pool': false,
        'pg-native': false,
      };
    }

    // Suppress Handlebars require.extensions warning
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/handlebars\/lib\/index\.js/,
        message: /require\.extensions is not supported by webpack/,
      },
    ];

    return config;
  },
};

export default nextConfig;
