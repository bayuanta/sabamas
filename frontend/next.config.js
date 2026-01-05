const isAndroidBuild = process.env.IS_ANDROID_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isAndroidBuild ? 'export' : undefined, // Only use export for Android builds
  reactStrictMode: false,
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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'self' blob: data: gap:; style-src * 'self' 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * 'self' 'unsafe-inline' blob: data: gap:; connect-src * 'self' 'unsafe-inline' blob: data: gap:; frame-src * 'self' blob: data: gap:;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
