'use client'

import MobileHeader from '@/components/mobile/MobileHeader'
import { FileText, ChevronRight, TrendingUp, AlertCircle, Package } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function MobileReports() {
    const router = useRouter()

    const reports = [
        {
            id: 'finance',
            title: 'Laporan Keuangan',
            desc: 'Rekap pemasukan harian & bulanan',
            icon: TrendingUp,
            color: 'bg-green-500',
            path: '/m/reports/payments'
        },
        {
            id: 'arrears',
            title: 'Laporan Tunggakan',
            desc: 'Daftar pelanggan belum bayar',
            icon: AlertCircle,
            color: 'bg-red-500',
            path: '/m/reports/arrears'
        },
        {
            id: 'rosok',
            title: 'Laporan Rosok',
            desc: 'Rekap penjualan barang bekas',
            icon: Package,
            color: 'bg-orange-500',
            path: '/m/reports/rosok'
        },
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Laporan" />

            <div className="p-4 space-y-4">
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/30 mb-6">
                    <h2 className="text-xl font-bold mb-1">Pusat Laporan</h2>
                    <p className="text-indigo-100 text-sm">
                        Pantau kinerja keuangan dan operasional secara real-time dari aplikasi mobile.
                    </p>
                </div>

                <div className="grid gap-3">
                    {reports.map((report, index) => {
                        const Icon = report.icon
                        return (
                            <motion.button
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => router.push(report.path)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center text-left active:scale-98 transition-transform"
                            >
                                <div className={`w-12 h-12 ${report.color} bg-opacity-10 rounded-xl flex items-center justify-center mr-4`}>
                                    <Icon className={`w-6 h-6 ${report.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{report.title}</h3>
                                    <p className="text-xs text-gray-500">{report.desc}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </motion.button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
