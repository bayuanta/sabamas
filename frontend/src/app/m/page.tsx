'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, customersApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import {
    TrendingUp,
    Users,
    Receipt,
    AlertCircle,
    ArrowRight,
    DollarSign,
    Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function MobileDashboard() {
    const router = useRouter()

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/m-login')
        }
    }, [router])

    // Fetch dashboard stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await reportsApi.getDashboard()
            return data
        },
    })

    const statCards = [
        {
            id: 'income-today',
            label: 'Pemasukan Hari Ini',
            value: formatCurrency(stats?.pemasukanHariIni || 0),
            icon: DollarSign,
            color: 'bg-green-500',
            textColor: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            id: 'income-month',
            label: 'Pemasukan Bulan Ini',
            value: formatCurrency(stats?.pemasukanBulanIni || 0),
            icon: TrendingUp,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            id: 'transactions-today',
            label: 'Transaksi Hari Ini',
            value: stats?.wargaBayarHariIni || 0,
            icon: Receipt,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            id: 'arrears',
            label: 'Total Tunggakan',
            value: formatCurrency(stats?.totalTunggakan || 0),
            icon: AlertCircle,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            bgColor: 'bg-red-50',
        },
    ]

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <MobileHeader title="Dashboard" />

            <div className="p-4 space-y-4">
                {/* Welcome Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm mb-1">Selamat Datang</p>
                            <h2 className="text-2xl font-bold">Admin Sabamas</h2>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-indigo-100">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {statCards.map((card, index) => {
                        const Icon = card.icon
                        return (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                            >
                                <div className={`w-10 h-10 ${card.bgColor} rounded-xl flex items-center justify-center mb-3`}>
                                    <Icon className={`w-5 h-5 ${card.textColor}`} />
                                </div>
                                <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                                <p className={`text-lg font-bold ${card.textColor}`}>
                                    {card.value}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => router.push('/m/billing')}
                            className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                    <Receipt className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-semibold text-gray-900">Input Pembayaran</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-indigo-600" />
                        </button>

                        <button
                            onClick={() => router.push('/m/customers')}
                            className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-semibold text-gray-900">Lihat Pelanggan</span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-purple-600" />
                        </button>
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                {stats?.recentPayments && stats.recentPayments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Transaksi Terbaru</h3>
                            <button
                                onClick={() => router.push('/m/transactions')}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Lihat Semua
                            </button>
                        </div>
                        <div className="space-y-3">
                            {stats.recentPayments.slice(0, 5).map((payment: any) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {payment.customer?.nama || payment.customer_nama}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600 text-sm">
                                            {formatCurrency(payment.jumlah_bayar)}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {payment.metode_bayar}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
