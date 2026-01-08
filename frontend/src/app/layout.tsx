import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ReactQueryProvider } from '@/lib/react-query'
import FaviconManager from '@/components/FaviconManager'
// Script from next/script removed here, but needed for other things? No, only for brote scripts.

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SABAMAS - Sistem Billing Sampah',
  description: 'Aplikasi billing dan manajemen pembayaran sampah',
  icons: {
    icon: '/logo-sabamas.png',
  },
  manifest: '/manifest.json',
}

import { Suspense } from 'react'
import Preloader from '@/components/Preloader'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={plusJakartaSans.className}>
        <Suspense fallback={null}>
          <Preloader />
        </Suspense>
        <ReactQueryProvider>
          <FaviconManager />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  )
}
