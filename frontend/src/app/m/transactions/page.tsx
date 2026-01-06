'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Receipt, Calendar, Filter, User, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimezoneUtil } from '@/../../backend/src/common/utils/timezone.util'

export default function MobileTransactions() {
    const router = useRouter()
    const [filterOpen, setFilterOpen] = useState(false)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [metodeBayar, setMetodeBayar] = useState('')

    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments', { dateFrom, dateTo, metodeBayar }],
        queryFn: async () => {
            const { data } = await paymentsApi.getAll({
                dateFrom,
                dateTo,
                metode_bayar: metodeBayar || undefined,
                limit: 50 // Limit for mobile view
            })
            return data
        },
    })

    // Group payments by date
    const groupedPayments = payments?.data?.reduce((groups: any, payment: any) => {
        const date = new Date(payment.tanggal_bayar).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        })

        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(payment)
        return groups
    }, {})

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader
                title="Riwayat Transaksi"
                actions={
                    <button
                        onClick={() => setFilterOpen(!filterOpen)}
                        className={`p-2 rounded-full transition-colors ${filterOpen ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                }
            />

            {/* Filter Panel */}
            <AnimatePresence>
                {filterOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Dari</label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1">Sampai</label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full p-2 bg-gray-50 rounded-lg text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Metode</label>
                                <div className="flex gap-2">
                                    {['', 'tunai', 'transfer'].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMetodeBayar(m)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${metodeBayar === m
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            {m === '' ? 'Semua' : m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Transaction List */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-gray-400 text-sm">Memuat transaksi...</p>
                    </div>
                ) : !payments?.data || payments.data.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Receipt className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-bold mb-1">Belum Ada Transaksi</h3>
                        <p className="text-gray-500 text-sm">Riwayat pembayaran akan muncul di sini</p>
                    </div>
                ) : (
                    Object.entries(groupedPayments).map(([date, items]: [string, any]) => (
                        <div key={date} className="mb-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1 sticky top-14 bg-gray-50 py-2 z-10">
                                {date}
                            </h3>
                            <div className="space-y-3">
                                {items.map((payment: any) => (
                                    <motion.div
                                        key={payment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.metode_bayar === 'tunai' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {payment.metode_bayar === 'tunai' ? <Receipt className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 line-clamp-1">{payment.customer?.nama || 'Pelanggan dihapus'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {/* Simple time display */}
                                                        {new Date(payment.tanggal_bayar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                        {' • '}
                                                        {Array.isArray(payment.bulan_dibayar) ? `${payment.bulan_dibayar.length} bulan` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">{formatCurrency(payment.jumlah_bayar)}</p>
                                                <p className={`text-[10px] font-semibold uppercase ${payment.metode_bayar === 'tunai' ? 'text-green-600' : 'text-blue-600'
                                                    }`}>{payment.metode_bayar}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-1">
                                            <button
                                                onClick={() => generateReceiptPDF(payment)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                                Cetak
                                            </button>
                                            <button
                                                onClick={() => shareViaWhatsApp(payment, payment.customer?.nomor_telepon)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                WA
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function CreditCard(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    )
}
