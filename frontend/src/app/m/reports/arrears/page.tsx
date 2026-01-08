'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, customersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import MobileHeader from '@/components/mobile/MobileHeader'
import { AlertCircle, Filter, User, MapPin, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileArrearsReportPage() {
    const router = useRouter()
    const [wilayah, setWilayah] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    // Fetch Wilayah List
    const { data: wilayahList } = useQuery({
        queryKey: ['wilayah'],
        queryFn: async () => {
            const { data } = await customersApi.getWilayahList()
            return data
        }
    })

    const { data: report, isLoading } = useQuery({
        queryKey: ['arrears-report', { wilayah }],
        queryFn: async () => {
            const { data } = await reportsApi.getArrears({ wilayah })
            return data
        },
    })

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Laporan Tunggakan" showBack />

            {/* Check Summary loaded */}
            {report?.summary && (
                <div className="bg-red-500 p-6 text-white sticky top-[57px] z-10 shadow-lg mb-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-white/80 text-xs font-bold uppercase mb-1">Total Tunggakan</p>
                            <h2 className="text-3xl font-extrabold tracking-tight">
                                {formatCurrency(report.summary.totalArrears)}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-xs font-bold uppercase mb-1">Pelanggan</p>
                            <h2 className="text-2xl font-bold">{report.summary.totalCustomers}</h2>
                        </div>
                    </div>

                    {/* Compact Filter inside Header */}
                    <div className="bg-white/10 rounded-xl p-2 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-white/70 ml-1" />
                        <select
                            value={wilayah}
                            onChange={(e) => setWilayah(e.target.value)}
                            className="bg-transparent text-white font-medium text-sm w-full outline-none option:text-gray-900"
                        >
                            <option value="" className="text-gray-900">Semua Wilayah</option>
                            {wilayahList?.map((w: string) => (
                                <option key={w} value={w} className="text-gray-900">{w}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="px-4 pb-4 space-y-3">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    </div>
                ) : (!report?.customers || report.customers.length === 0) ? (
                    <div className="py-20 text-center bg-white rounded-2xl shadow-sm">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="font-bold text-gray-900">Bebas Tunggakan!</h3>
                        <p className="text-gray-500 text-sm mt-1">Tidak ada pelanggan menunggak saat ini.</p>
                    </div>
                ) : (
                    report.customers.map((item: any) => (
                        <div
                            key={item.customer.id}
                            onClick={() => router.push(`/m/customers/${item.customer.id}`)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900">{item.customer.nama}</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{item.customer.wilayah}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-red-600">
                                        {formatCurrency(item.arrears.totalArrears)}
                                    </p>
                                    <span className="inline-block bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded mt-1">
                                        {item.arrears.totalMonths} Bulan
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
