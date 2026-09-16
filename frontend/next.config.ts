import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendOrigin = process.env.BACKEND_URL ?? 'http://localhost:5001';

    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
