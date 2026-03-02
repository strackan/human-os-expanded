import type { NextConfig } from "next";

const ARI_BACKEND =
  process.env.ARI_BACKEND_URL || "http://localhost:4250";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${ARI_BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
