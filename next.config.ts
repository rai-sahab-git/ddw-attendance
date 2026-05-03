import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['xlsx'],
  turbopack: {},   // silence the turbopack warning
}

export default nextConfig