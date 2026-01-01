'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Users, CreditCard, FileText } from 'lucide-react'

const quickActions = [
    {
        title: 'Pembayaran Baru',
        description: 'Catat pembayaran',
        icon: Plus,
        href: '/billing',
        color: 'purple',
        gradient: 'from-purple-500 to-purple-600'
    },
    {
        title: 'Tambah Pelanggan',
        description: 'Daftar pelanggan baru',
        icon: Users,
        href: '/customers',
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600'
    },
    {
        title: 'Billing Kolektif',
        description: 'Proses banyak tagihan',
        icon: CreditCard,
        href: '/billing/bulk',
        color: 'green',
        gradient: 'from-green-500 to-green-600'
    },
    {
        title: 'Lihat Laporan',
        description: 'Analisis data',
        icon: FileText,
        href: '/reports',
        color: 'orange',
        gradient: 'from-orange-500 to-orange-600'
    }
]

export default function QuickActions() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                    <motion.div
                        key={action.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                        <Link
                            href={action.href}
                            className="group block"
                        >
                            <div className="relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                <div className="relative z-10 flex items-center gap-3">
                                    {/* Icon */}
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className={`p-2.5 bg-gradient-to-br ${action.gradient} rounded-lg shadow-md`}
                                    >
                                        <Icon className="w-5 h-5 text-white" />
                                    </motion.div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                                            {action.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {action.description}
                                        </p>
                                    </div>

                                    {/* Arrow */}
                                    <motion.div
                                        initial={{ x: 0 }}
                                        whileHover={{ x: 4 }}
                                        className="text-gray-400 group-hover:text-gray-600"
                                    >
                                        →
                                    </motion.div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )
            })}
        </div>
    )
}
