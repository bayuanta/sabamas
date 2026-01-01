import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ReactQueryProvider } from '@/lib/react-query'
import FaviconManager from '@/components/FaviconManager'
import Script from 'next/script'

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SABAMAS - Sistem Billing Sampah',
  description: 'Aplikasi billing dan manajemen pembayaran sampah',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
}

import { Suspense } from 'react'
import Preloader from '@/components/Preloader'

// ... existing imports

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

        {/* Vendors CSS */}
        <link rel="stylesheet" href="/assets/vendors/bootstrap/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/vendors/animate/animate.min.css" />
        <link rel="stylesheet" href="/assets/vendors/animate/custom-animate.css" />
        <link rel="stylesheet" href="/assets/vendors/fontawesome/css/all.min.css" />
        <link rel="stylesheet" href="/assets/vendors/jarallax/jarallax.css" />
        <link rel="stylesheet" href="/assets/vendors/jquery-magnific-popup/jquery.magnific-popup.css" />
        <link rel="stylesheet" href="/assets/vendors/nouislider/nouislider.min.css" />
        <link rel="stylesheet" href="/assets/vendors/nouislider/nouislider.pips.css" />
        <link rel="stylesheet" href="/assets/vendors/odometer/odometer.min.css" />
        <link rel="stylesheet" href="/assets/vendors/swiper/swiper.min.css" />
        <link rel="stylesheet" href="/assets/vendors/brote-icons/style.css" />
        <link rel="stylesheet" href="/assets/vendors/tiny-slider/tiny-slider.min.css" />
        <link rel="stylesheet" href="/assets/vendors/reey-font/stylesheet.css" />
        <link rel="stylesheet" href="/assets/vendors/owl-carousel/owl.carousel.min.css" />
        <link rel="stylesheet" href="/assets/vendors/owl-carousel/owl.theme.default.min.css" />
        <link rel="stylesheet" href="/assets/vendors/bxslider/jquery.bxslider.css" />
        <link rel="stylesheet" href="/assets/vendors/bootstrap-select/css/bootstrap-select.min.css" />
        <link rel="stylesheet" href="/assets/vendors/vegas/vegas.min.css" />
        <link rel="stylesheet" href="/assets/vendors/jquery-ui/jquery-ui.css" />
        <link rel="stylesheet" href="/assets/vendors/timepicker/timePicker.css" />

        {/* Template Styles */}
        <link rel="stylesheet" href="/assets/css/brote.css" />
        <link rel="stylesheet" href="/assets/css/brote-responsive.css" />
      </head>
      <body className={plusJakartaSans.className}>
        <Suspense fallback={null}>
          <Preloader />
        </Suspense>
        <ReactQueryProvider>
          <FaviconManager />
          {children}
        </ReactQueryProvider>

        {/* Vendors Scripts */}
        <Script src="/assets/vendors/jquery/jquery-3.6.0.min.js" strategy="beforeInteractive" />
        <Script src="/assets/vendors/bootstrap/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jarallax/jarallax.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-ajaxchimp/jquery.ajaxchimp.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-appear/jquery.appear.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-circle-progress/jquery.circle-progress.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-magnific-popup/jquery.magnific-popup.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-validate/jquery.validate.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/nouislider/nouislider.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/odometer/odometer.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/swiper/swiper.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/tiny-slider/tiny-slider.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/wnumb/wNumb.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/wow/wow.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/isotope/isotope.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/countdown/countdown.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/owl-carousel/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/bxslider/jquery.bxslider.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/bootstrap-select/js/bootstrap-select.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/vegas/vegas.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/jquery-ui/jquery-ui.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/timepicker/timePicker.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/circleType/jquery.circleType.js" strategy="afterInteractive" />
        <Script src="/assets/vendors/circleType/jquery.lettering.min.js" strategy="afterInteractive" />

        {/* Template JS */}
        <Script src="/assets/js/brote.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
