'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { customersApi, tariffsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import MobileHeader from '@/components/mobile/MobileHeader'
import { Search, Filter, AlertCircle, Edit, Calendar, User, Tag, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileSelectiveTariffPage() {
    const router = useRouter()

    // Data state
    const [customers, setCustomers] = useState<any[]>([])
    const [tariffs, setTariffs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    // Filter state
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filterTariff, setFilterTariff] = useState('')

    // Update state
    const [newTariffId, setNewTariffId] = useState('')
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
    const [updating, setUpdating] = useState(false)

    // Fetch Tariffs
    useQuery({
        queryKey: ['tariffs'],
        queryFn: async () => {
            const { data } = await tariffsApi.getCategories()
            setTariffs(data)
            return data
        }
    })

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch Customers
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true)
            try {
                const params: any = {
                    limit: 50, // Limit smaller for mobile
                    search: debouncedSearch,
                }
                if (filterTariff) params.tarif_id = filterTariff

                const response = await customersApi.getAll(params)
                setCustomers(response.data.data || [])
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchCustomers()
    }, [debouncedSearch, filterTariff])

    const handleUpdateTariff = async () => {
        if (!selectedCustomer || !newTariffId || !effectiveDate) return

        setUpdating(true)
        try {
            await tariffsApi.bulkUpdateCustomerTariff({
                customer_ids: [selectedCustomer.id],
                tarif_id: newTariffId,
                tanggal_efektif: effectiveDate
            })

            // Refresh list (optimistic update would be better but this is safer)
            const { data } = await customersApi.getAll({ search: debouncedSearch, limit: 50 })
            setCustomers(data.data || [])

            setSelectedCustomer(null)
            setNewTariffId('')
        } catch (error) {
            alert('Gagal update tarif')
        } finally {
            setUpdating(false)
        }
    }

    const openEditModal = (customer: any) => {
        setSelectedCustomer(customer)
        setNewTariffId(customer.tarif_id || '')
        // Default effective date handled in state init
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Tarif Selektif" />

            {/* Sticky Search & Filter */}
            <div className="sticky top-[57px] bg-white z-20 px-4 py-3 shadow-sm border-b border-gray-100">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            placeholder="Cari pelanggan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2.5 rounded-xl border ${filterTariff ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {isFilterOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 overflow-hidden"
                    >
                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Filter Tarif</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setFilterTariff('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${!filterTariff ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                Semua
                            </button>
                            {tariffs.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setFilterTariff(t.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${filterTariff === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
                                >
                                    {t.nama_kategori}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* List */}
            <div className="p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        Tidak ada pelanggan ditemukan
                    </div>
                ) : (
                    customers.map((customer) => (
                        <div key={customer.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900">{customer.nama}</h3>
                                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                        <User className="w-3 h-3 mr-1" />
                                        {customer.nomor_pelanggan || '-'}
                                        <span className="mx-1.5">•</span>
                                        {customer.wilayah}
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal(customer)}
                                    className="p-2 bg-indigo-50 text-indigo-600 rounded-lg active:bg-indigo-100"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-full ${customer.tarif ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Tag className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-gray-900">
                                            {customer.tarif?.nama_kategori || 'Belum ada tarif'}
                                        </p>
                                        {customer.tarif && (
                                            <p className="text-xs text-gray-500">
                                                {formatCurrency(customer.tarif.harga_per_bulan)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {customer.tanggal_efektif_tarif && (
                                    <div className="text-right text-xs">
                                        <p className="text-gray-400">Efektif per</p>
                                        <p className="font-medium text-gray-700">
                                            {new Date(customer.tanggal_efektif_tarif).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal (Sheet) */}
            <AnimatePresence>
                {selectedCustomer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCustomer(null)}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Ubah Tarif Pelanggan</h2>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Pelanggan</p>
                                <p className="font-bold text-lg text-gray-900">{selectedCustomer.nama}</p>
                                <p className="text-sm text-gray-600 mt-1">Tarif saat ini: {selectedCustomer.tarif?.nama_kategori || '-'}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Pilih Tarif Baru</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {tariffs.map(t => (
                                            <label
                                                key={t.id}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${newTariffId === t.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200 hover:bg-gray-50'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="tariff"
                                                        value={t.id}
                                                        checked={newTariffId === t.id}
                                                        onChange={(e) => setNewTariffId(e.target.value)}
                                                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 hidden"
                                                    />
                                                    <div>
                                                        <p className={`font-bold text-sm ${newTariffId === t.id ? 'text-indigo-900' : 'text-gray-900'}`}>{t.nama_kategori}</p>
                                                        <p className={`text-xs ${newTariffId === t.id ? 'text-indigo-700' : 'text-gray-500'}`}>{t.deskripsi || '-'}</p>
                                                    </div>
                                                </div>
                                                <div className="font-bold text-sm text-gray-900">
                                                    {formatCurrency(t.harga_per_bulan)}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Efektif</label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Perubahan tarif akan berlaku mulai tanggal ini.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateTariff}
                                disabled={updating || !newTariffId}
                                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-98 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
