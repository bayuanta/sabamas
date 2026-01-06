'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Wallet, Upload, History, AlertCircle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileDeposits() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState<'status' | 'history'>('status')
    const [successModalOpen, setSuccessModalOpen] = useState(false)

    // Fetch undeposited funds (Uang di tangan)
    const { data: undepositedData, isLoading } = useQuery({
        queryKey: ['undeposited'],
        queryFn: async () => {
            // Assuming endpoint exists or calculating from local check
            // For now using paymentsApi.getUndeposited() if available, or fetch all unpaid cash payments
            const { data } = await paymentsApi.getUndeposited()
            return data // Expecting array of payments
        },
    })

    // Calculate Total Undeposited
    const totalUndeposited = undepositedData?.reduce((sum: number, p: any) => sum + p.jumlah_bayar, 0) || 0
    const totalCount = undepositedData?.length || 0

    // Create Deposit Mutation
    const depositMutation = useMutation({
        mutationFn: () => paymentsApi.createDeposit({
            paymentIds: undepositedData?.map((p: any) => p.id) || []
        }),
        onSuccess: () => {
            setSuccessModalOpen(true)
            queryClient.invalidateQueries({ queryKey: ['undeposited'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
        },
        onError: () => alert('Gagal memproses setoran')
    })

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Setoran Kas" showBack />

            {/* Tabs */}
            <div className="flex p-1 bg-white border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('status')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'status' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
                        }`}
                >
                    Status Kas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
                        }`}
                >
                    Riwayat
                </button>
            </div>

            <div className="p-4">
                {activeTab === 'status' ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-indigo-100 text-sm font-medium">Total Uang di Tangan</span>
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-bold mb-4">{formatCurrency(totalUndeposited)}</h2>
                            <div className="bg-white/20 rounded-xl p-3 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" />
                                <span className="text-sm">{totalCount} transaksi menunggu disetor</span>
                            </div>
                        </div>

                        {/* List of Payments */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 px-1">Rincian Transaksi</h3>
                            {isLoading ? (
                                <div className="text-center py-10 text-gray-400">Memuat data...</div>
                            ) : totalCount === 0 ? (
                                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                                    <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                    <p className="text-gray-900 font-bold">Semua Aman</p>
                                    <p className="text-sm text-gray-500">Tidak ada uang yang perlu disetor</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {undepositedData?.slice(0, 5).map((p: any) => (
                                        <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-semibold text-gray-900">{p.customer?.nama}</p>
                                                <p className="text-xs text-gray-500">{new Date(p.tanggal_bayar).toLocaleDateString('id-ID')}</p>
                                            </div>
                                            <span className="font-bold text-green-600">{formatCurrency(p.jumlah_bayar)}</span>
                                        </div>
                                    ))}
                                    {totalCount > 5 && (
                                        <p className="text-center text-xs text-gray-400 mt-2">
                                            Dan {totalCount - 5} transaksi lainnya...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Button */}
                        {totalCount > 0 && (
                            <button
                                onClick={() => depositMutation.mutate()}
                                disabled={depositMutation.isPending}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center shadow-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                {depositMutation.isPending ? 'Memproses...' : 'Setor Sekarang'}
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <HistoryTab />
                )}
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {successModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm text-center"
                        >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setoran Berhasil!</h2>
                            <p className="text-gray-500 mb-6">
                                Dana sebesar <span className="font-bold text-gray-900">{formatCurrency(totalUndeposited)}</span> berhasil dicatat sebagai setoran.
                            </p>
                            <button
                                onClick={() => setSuccessModalOpen(false)}
                                className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function HistoryTab() {
    // Ideally fetch deposit history
    // For prototype, show empty state or dummy
    return (
        <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">Belum Ada Riwayat</h3>
            <p className="text-sm text-gray-500">Riwayat setoran Anda akan muncul di sini</p>
        </div>
    )
}
