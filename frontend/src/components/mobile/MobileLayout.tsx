'use client'

import { useState } from 'react'
import BottomNav from '@/components/mobile/BottomNav'
import MobileDrawer from '@/components/mobile/MobileDrawer'

export default function MobileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Main Content */}
            <main className="min-h-screen">
                {children}
            </main>

            {/* Bottom Navigation */}
            <BottomNav onMenuClick={() => setIsDrawerOpen(true)} />

            {/* Drawer Menu */}
            <MobileDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />

            {/* Safe Area Styles */}
            <style jsx global>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
        </div>
    )
}
