import type { NextConfig } from 'next'
// @ts-ignore
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',  // dev mein disable — only production mein active
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      },
    },
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-images',
        expiration: { maxEntries: 50, maxAgeSeconds: 86400 },
      },
    },
  ],
})

const nextConfig: NextConfig = {
  // xlsx ke liye — server-side only, browser bundle mein nahi aayega
  serverExternalPackages: ['xlsx'],
}

export default pwaConfig(nextConfig)