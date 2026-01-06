'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { customersApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import CustomerCard from '@/components/mobile/CustomerCard'
import { Search, Plus, Filter, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileCustomers() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [showFilters, setShowFilters] = useState(false)
    const [statusFilter, setStatusFilter] = useState('aktif')
    const [wilayahFilter, setWilayahFilter] = useState('')

    const { data: customersResponse, isLoading } = useQuery({
        queryKey: ['customers', { search, status: statusFilter, wilayah: wilayahFilter }],
        queryFn: async () => {
            // Note: Backend might need adjustment if it doesn't support multiple filter params exactly like this
            // For now we assume standard getAll params
            const { data } = await customersApi.getAll({
                search,
                status: statusFilter === 'all' ? undefined : statusFilter,
                wilayah: wilayahFilter || undefined,
                limit: 100 // Mobile limit
            })
            return data
        },
    })

    // Fetch wilayah list for filter
    const { data: wilayahList } = useQuery({
        queryKey: ['wilayah'],
        queryFn: async () => {
            const { data } = await customersApi.getAll({ limit: 1000 })
            // Extract unique wilayahs
            const uniqueWilayahs = Array.from(new Set(data.data.map((c: any) => c.wilayah)))
            return uniqueWilayahs as string[]
        },
    })

    const handlePay = (id: string) => {
        router.push(`/m/billing?customerId=${id}`)
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader
                title="Pelanggan"
                actions={
                    <button
                        onClick={() => router.push('/m/customers/add')}
                        className="p-2 -mr-2 text-indigo-600 font-bold"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                }
            />

            {/* Search & Filter Bar */}
            <div className="sticky top-14 bg-white z-30 px-4 py-3 border-b border-gray-100 shadow-sm">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau ID..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl border transition-colors ${showFilters || wilayahFilter !== '' || statusFilter !== 'aktif'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'bg-white border-gray-200 text-gray-600'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Expandable Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 pb-2 space-y-4">
                                {/* Status Filter */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['all', 'aktif', 'nonaktif', 'cuti'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setStatusFilter(status)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${statusFilter === status
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {status === 'all' ? 'Semua' : status}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Wilayah Filter */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Wilayah</label>
                                    <select
                                        value={wilayahFilter}
                                        onChange={(e) => setWilayahFilter(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Semua Wilayah</option>
                                        {wilayahList?.map((w) => (
                                            <option key={w} value={w}>{w}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Customer List */}
            <div className="p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
                        <p className="text-gray-400 text-sm">Memuat data pelanggan...</p>
                    </div>
                ) : customersResponse?.data?.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-bold mb-1">Tidak Ditemukan</h3>
                        <p className="text-gray-500 text-sm">Coba ubah kata kunci pencarian Anda</p>
                    </div>
                ) : (
                    <motion.div layout className="space-y-1">
                        {customersResponse?.data?.map((customer: any) => (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                onPay={() => handlePay(customer.id)}
                                onEdit={() => router.push(`/m/customers/${customer.id}/edit`)}
                                onDetail={() => router.push(`/m/customers/${customer.id}`)}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* FAB Add Customer */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/m/customers/add')}
                className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center z-40"
            >
                <Plus className="w-8 h-8" />
            </motion.button>
        </div>
    )
}
