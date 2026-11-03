/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chizmo/core', '@chizmo/db', '@chizmo/ai'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
