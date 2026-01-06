'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, Receipt, Users, List, Menu } from 'lucide-react'

interface BottomNavProps {
    onMenuClick: () => void
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
    const pathname = usePathname()
    const router = useRouter()

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/m' },
        { id: 'billing', label: 'Billing', icon: Receipt, path: '/m/billing' },
        { id: 'customers', label: 'Pelanggan', icon: Users, path: '/m/customers' },
        { id: 'transactions', label: 'Transaksi', icon: List, path: '/m/transactions' },
        { id: 'more', label: 'Lainnya', icon: Menu, path: null },
    ]

    const handleNavClick = (item: typeof navItems[0]) => {
        if (item.path) {
            router.push(item.path)
        } else if (item.id === 'more') {
            onMenuClick()
        }
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.path === pathname || (item.path !== '/m' && pathname?.startsWith(item.path || ''))

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? 'text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                            <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
