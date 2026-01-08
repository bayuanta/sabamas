'use client'

import { useRouter } from 'next/navigation'
import { X, BarChart3, Package, FileText, Settings, LogOut, DollarSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
    const router = useRouter()

    const menuItems = [
        { id: 'tariffs', label: 'Tarif', icon: Package, path: '/m/tariffs' },
        { id: 'deposits', label: 'Setoran', icon: DollarSign, path: '/m/deposits' },
        { id: 'reports', label: 'Laporan', icon: FileText, path: '/m/reports' },
        { id: 'settings', label: 'Pengaturan', icon: Settings, path: '/m/settings' },
    ]

    const handleMenuClick = (path: string) => {
        router.push(path)
        onClose()
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/m-login')
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-4">
                            {menuItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleMenuClick(item.path)}
                                        className="flex items-center w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-4">
                                            <Icon className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <span className="text-base font-medium text-gray-900">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Logout Button */}
                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-full px-6 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                            >
                                <LogOut className="w-5 h-5 text-red-600 mr-2" />
                                <span className="text-base font-semibold text-red-600">Keluar</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
