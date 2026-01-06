'use client'

import MobileLayout from '@/components/mobile/MobileLayout'

export default function MobileRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <MobileLayout>{children}</MobileLayout>
}
