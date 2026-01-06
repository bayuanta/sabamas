'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical } from 'lucide-react'

interface MobileHeaderProps {
    title: string
    showBack?: boolean
    onBack?: () => void
    actions?: React.ReactNode
}

export default function MobileHeader({ title, showBack = false, onBack, actions }: MobileHeaderProps) {
    const router = useRouter()

    const handleBack = () => {
        if (onBack) {
            onBack()
        } else {
            router.back()
        }
    }

    return (
        <header className="sticky top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-top">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: Back button or empty space */}
                <div className="w-10">
                    {showBack && (
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <h1 className="text-lg font-bold text-gray-900 truncate px-2">
                    {title}
                </h1>

                {/* Right: Actions or empty space */}
                <div className="w-10 flex justify-end">
                    {actions}
                </div>
            </div>
        </header>
    )
}
