'use client'

import MobileHeader from '@/components/mobile/MobileHeader'
import { FileText, Download, Calendar, Share2, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function MobileReports() {
    const [dateRange, setDateRange] = useState('Bulan Ini')

    const reports = [
        { id: 'daily', title: 'Laporan Harian', desc: 'Rekap transaksi hari ini', icon: FileText, color: 'bg-blue-500' },
        { id: 'monthly', title: 'Laporan Bulanan', desc: 'Rekap pendapatan bulan ini', icon: Calendar, color: 'bg-purple-500' },
        { id: 'arrears', title: 'Laporan Tunggakan', desc: 'Daftar warga belum bayar', icon: FileText, color: 'bg-red-500' },
        { id: 'rosok', title: 'Laporan Rosok', desc: 'Rekap penjualan barang bekas', icon: Share2, color: 'bg-orange-500' },
    ]

    const handleDownload = (id: string) => {
        // Implement report download logic or open PDF url
        alert(`Sedang mengunduh ${id}... (Fitur Download akan diimplementasikan di Phase 4)`)
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Laporan" showBack />

            <div className="p-4 space-y-4">
                {/* Date Filter Card */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Periode</p>
                        <p className="font-bold text-gray-900">{dateRange}</p>
                    </div>
                    <button className="text-indigo-600 font-bold text-sm">Ubah</button>
                </div>

                {/* Report Grid */}
                <div className="grid gap-3">
                    {reports.map((report, index) => {
                        const Icon = report.icon
                        return (
                            <motion.button
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => handleDownload(report.title)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center text-left hover:bg-gray-50 transition-colors group"
                            >
                                <div className={`w-12 h-12 ${report.color} bg-opacity-10 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${report.color.replace('bg-', 'text-')}`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900">{report.title}</h3>
                                    <p className="text-xs text-gray-500">{report.desc}</p>
                                </div>
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <Download className="w-5 h-5 text-gray-600" />
                                </div>
                            </motion.button>
                        )
                    })}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Laporan akan diunduh dalam format PDF siap cetak.
                    </p>
                </div>
            </div>
        </div>
    )
}
