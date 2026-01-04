/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' - we need dynamic rendering for Supabase
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
