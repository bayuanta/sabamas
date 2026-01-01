'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { customersApi, tariffsApi } from '@/lib/api'
import { format } from 'date-fns'
import { Search, Filter, AlertCircle, Users, ArrowRight, CheckCircle, X, Calendar } from 'lucide-react'

export default function SelectiveTariffPage() {
    const [customers, setCustomers] = useState<any[]>([])
    const [tariffs, setTariffs] = useState<any[]>([])
    const [wilayahList, setWilayahList] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [search, setSearch] = useState('')
    const [filterWilayah, setFilterWilayah] = useState('')
    const [filterTariff, setFilterTariff] = useState('')

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Bulk Update State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newTariffId, setNewTariffId] = useState('')
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        fetchCustomers()
    }, [search, filterWilayah, filterTariff])

    const fetchInitialData = async () => {
        try {
            const [tariffsRes, wilayahRes] = await Promise.all([
                tariffsApi.getCategories(),
                customersApi.getWilayahList()
            ])
            setTariffs(tariffsRes.data)
            setWilayahList(wilayahRes.data)
        } catch (error) {
            console.error('Error fetching initial data:', error)
        }
    }

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const params: any = {}
            if (search) params.search = search
            if (filterWilayah) params.wilayah = filterWilayah
            if (filterTariff) params.tarif_id = filterTariff
            params.limit = 1000

            const response = await customersApi.getAll(params)
            setCustomers(response.data.data || [])
        } catch (error) {
            console.error('Error fetching customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(customers.map(c => c.id))
        } else {
            setSelectedIds([])
        }
    }

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBulkUpdate = async () => {
        if (!newTariffId) {
            alert('Pilih kategori tarif baru')
            return
        }
        if (!effectiveDate) {
            alert('Pilih tanggal efektif')
            return
        }

        setUpdating(true)
        try {
            await tariffsApi.bulkUpdateCustomerTariff({
                customer_ids: selectedIds,
                tarif_id: newTariffId,
                tanggal_efektif: effectiveDate
            })

            setIsModalOpen(false)
            setSelectedIds([])
            setNewTariffId('')
            fetchCustomers() // Refresh list
        } catch (error) {
            console.error('Error updating tariffs:', error)
            alert('Gagal memperbarui tarif')
        } finally {
            setUpdating(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tarif Selektif</h1>
                        <p className="text-gray-500 mt-1 text-lg">Ubah tarif pelanggan secara massal</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="search-input"
                                name="search"
                                type="text"
                                placeholder="Cari nama pelanggan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Select
                                id="filter-wilayah"
                                name="wilayah"
                                value={filterWilayah}
                                onChange={(e) => setFilterWilayah(e.target.value)}
                                options={[
                                    { value: '', label: 'Semua Wilayah' },
                                    ...wilayahList.map(w => ({ value: w, label: w }))
                                ]}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Select
                                id="filter-tariff"
                                name="tariff"
                                value={filterTariff}
                                onChange={(e) => setFilterTariff(e.target.value)}
                                options={[
                                    { value: '', label: 'Semua Tarif' },
                                    ...tariffs.map(t => ({ value: t.id, label: t.nama_kategori }))
                                ]}
                            />
                        </div>
                        <div className="md:col-span-2 flex items-end">
                            <Button
                                variant="secondary"
                                className="w-full h-[46px] bg-gray-100 hover:bg-gray-200 border-transparent"
                                onClick={() => {
                                    setSearch('')
                                    setFilterWilayah('')
                                    setFilterTariff('')
                                }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="bg-blue-600 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-blue-500/30 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 text-white">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{selectedIds.length} Pelanggan Dipilih</p>
                                <p className="text-blue-100 text-sm">Siap untuk perubahan tarif massal</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white text-blue-600 hover:bg-blue-50 border-transparent shadow-none font-bold"
                        >
                            Ubah Tarif Terpilih
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                )}

                {/* Customer List */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-5 w-16 text-center">
                                        <input
                                            id="select-all-customers"
                                            name="selectAll"
                                            type="checkbox"
                                            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            checked={customers.length > 0 && selectedIds.length === customers.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Pelanggan</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Wilayah</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tarif Saat Ini</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Harga</th>
                                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Efektif Sejak</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-500 font-medium">Memuat data pelanggan...</p>
                                        </td>
                                    </tr>
                                ) : customers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-medium">Tidak ada pelanggan ditemukan</p>
                                            <p className="text-gray-500 text-sm mt-1">Coba sesuaikan filter pencarian Anda</p>
                                        </td>
                                    </tr>
                                ) : (
                                    customers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className={`group transition-colors duration-200 ${selectedIds.includes(customer.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <td className="p-5 text-center">
                                                <input
                                                    id={`select-customer-${customer.id}`}
                                                    name={`selectCustomer-${customer.id}`}
                                                    type="checkbox"
                                                    className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                                    checked={selectedIds.includes(customer.id)}
                                                    onChange={() => handleSelectOne(customer.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-900">{customer.nama}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {customer.wilayah}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {customer.tarif?.nama_kategori || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 font-medium text-gray-900">
                                                {customer.tarif ? formatCurrency(customer.tarif.harga_per_bulan) : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {customer.tanggal_efektif_tarif
                                                        ? format(new Date(customer.tanggal_efektif_tarif), 'dd MMM yyyy')
                                                        : '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Confirmation Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Ubah Tarif Massal"
                >
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-yellow-800">Konfirmasi Perubahan</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Anda akan mengubah tarif untuk <strong className="text-yellow-900">{selectedIds.length} pelanggan</strong>.
                                    Perubahan ini akan mempengaruhi perhitungan tagihan mulai dari tanggal efektif yang dipilih.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-tariff-id" className="block text-sm font-bold text-gray-700 mb-2">
                                    Kategori Tarif Baru
                                </label>
                                <Select
                                    id="new-tariff-id"
                                    name="newTariffId"
                                    value={newTariffId}
                                    onChange={(e) => setNewTariffId(e.target.value)}
                                    options={[
                                        { value: '', label: 'Pilih Tarif Baru...' },
                                        ...tariffs.map(t => ({ value: t.id, label: `${t.nama_kategori} - ${formatCurrency(t.harga_per_bulan)}` }))
                                    ]}
                                />
                            </div>

                            <div>
                                <label htmlFor="effective-date" className="block text-sm font-bold text-gray-700 mb-2">
                                    Tanggal Efektif
                                </label>
                                <Input
                                    id="effective-date"
                                    name="effectiveDate"
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e: any) => setEffectiveDate(e.target.value)}
                                />
                                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Tagihan akan dihitung ulang menggunakan tarif baru mulai dari tanggal ini.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button
                                variant="secondary"
                                onClick={() => setIsModalOpen(false)}
                                disabled={updating}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleBulkUpdate}
                                disabled={updating || !newTariffId || !effectiveDate}
                                isLoading={updating}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Terapkan Perubahan
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    )
}
