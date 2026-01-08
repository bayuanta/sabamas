'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { rosokApi } from '@/lib/api'
import MobileHeader from '@/components/mobile/MobileHeader'
import { formatCurrency } from '@/lib/utils'
import { Package, Calendar, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function MobileRosokReport() {
    const [searchTerm, setSearchTerm] = useState('')
    const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA').slice(0, 8) + '01')
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'))

    const { data: sales, isLoading } = useQuery({
        queryKey: ['rosok-sales'],
        queryFn: async () => {
            const response = await rosokApi.getAll()
            return response.data
        },
    })

    const filteredSales = sales?.filter((sale: any) => {
        const matchesSearch = sale.pembeli?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.items?.some((item: any) => item.jenis_barang.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (!sale.pembeli && !searchTerm)

        const saleDate = new Date(sale.tanggal)
        const saleDateStr = sale.tanggal.split('T')[0]
        const matchesStart = !startDate || saleDateStr >= startDate
        const matchesEnd = !endDate || saleDateStr <= endDate

        return matchesSearch && matchesStart && matchesEnd
    })

    const totalRevenue = filteredSales?.reduce((acc: number, curr: any) => acc + curr.items.reduce((sum: number, item: any) => sum + item.total_harga, 0), 0) || 0
    const totalWeight = filteredSales?.reduce((acc: number, curr: any) => acc + curr.items.reduce((sum: number, item: any) => sum + item.berat, 0), 0) || 0

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <MobileHeader title="Laporan Rosok" />

            <div className="p-4 space-y-4">
                {/* Period Filter */}
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                    />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500 rounded-bl-full opacity-10"></div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Pendapatan</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500 rounded-bl-full opacity-10"></div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Berat</p>
                        <p className="text-lg font-bold text-gray-900">{totalWeight.toLocaleString('id-ID')} kg</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari pembeli atau barang..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                    />
                </div>

                {/* List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                    ) : filteredSales?.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            Tidak ada data
                        </div>
                    ) : (
                        filteredSales?.map((sale: any) => (
                            <div key={sale.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-gray-900">{sale.pembeli || 'Tanpa Nama'}</p>
                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {format(new Date(sale.tanggal), 'dd MMMM yyyy, HH:mm', { locale: id })}
                                        </div>
                                    </div>
                                    <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded-lg">
                                        {formatCurrency(sale.items.reduce((sum: number, i: any) => sum + i.total_harga, 0))}
                                    </span>
                                </div>

                                <div className="space-y-2 border-t border-gray-50 pt-2">
                                    {sale.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-gray-600">{item.jenis_barang}</span>
                                            <div className="flex gap-3">
                                                <span className="text-gray-500">{item.berat} kg</span>
                                                <span className="font-medium text-gray-900">{formatCurrency(item.total_harga)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
