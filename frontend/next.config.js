/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Penting untuk Capacitor (Static Export)
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  images: {
    unoptimized: true, // Penting untuk APK (karena tidak ada server image optimization)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  experimental: {
    // allowedDevOrigins: ['localhost:3000', '192.168.1.16:3000'],
  },
}

module.exports = nextConfig
