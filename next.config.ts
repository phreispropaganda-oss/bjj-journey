import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'bjj-journey-iota.vercel.app',
        '*.vercel.app',
      ],
    },
  },
}

export default nextConfig
