'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import MobileHeader from '@/components/mobile/MobileHeader'
import { Calendar, Filter, TrendingUp, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobilePaymentReportPage() {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)

    // YYYY-MM-DD
    const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split('T')[0])
    const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0])
    const [showFilters, setShowFilters] = useState(false)
    const [metodeBayar, setMetodeBayar] = useState('')

    const { data: report, isLoading } = useQuery({
        queryKey: ['payment-report', { dateFrom, dateTo, metodeBayar }],
        queryFn: async () => {
            const { data } = await reportsApi.getPayments({
                dateFrom,
                dateTo,
                metode_bayar: metodeBayar || undefined,
                limit: 100 // Limit for mobile
            })
            return data
        },
    })

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Laporan Keuangan" showBack />

            {/* Filter Bar */}
            <div className="bg-white p-4 shadow-sm border-b border-gray-100 sticky top-[57px] z-10">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-gray-50 p-2 rounded-xl flex items-center gap-2 border border-gray-200" onClick={() => setShowFilters(!showFilters)}>
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                            {new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3 space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Dari</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-1 block">Sampai</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Metode Pembayaran</label>
                                <div className="flex bg-gray-50 p-1 rounded-lg">
                                    {['', 'tunai', 'transfer'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setMetodeBayar(m)}
                                            className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${metodeBayar === m ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                                        >
                                            {m || 'Semua'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 space-y-4">
                {/* Summary Card */}
                {report?.summary && (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                            <TrendingUp className="w-5 h-5" />
                            <span className="text-sm font-medium">Total Pemasukan</span>
                        </div>
                        <p className="text-3xl font-extrabold tracking-tight">
                            {formatCurrency(report.summary.totalAmount)}
                        </p>
                        <p className="text-xs mt-2 bg-white/20 inline-block px-2 py-1 rounded-lg">
                            {report.summary.totalTransactions} Transaksi
                        </p>
                    </div>
                )}

                {/* List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-bold text-gray-900 text-sm">Rincian Transaksi</h3>
                    </div>

                    {isLoading ? (
                        <div className="py-10 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : (!report?.payments || report.payments.length === 0) ? (
                        <div className="py-10 text-center text-gray-400 text-sm">
                            Tidak ada data transaksi pada periode ini
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {report.payments.map((payment: any) => (
                                <div key={payment.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm mb-0.5">{payment.customer_nama}</p>
                                        <p className="text-xs text-gray-500">
                                            {formatDateTime(payment.tanggal_bayar)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600 text-sm">
                                            +{formatCurrency(payment.jumlah_bayar)}
                                        </p>
                                        <p className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                            {payment.metode_bayar}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
