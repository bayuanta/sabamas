import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rosokApi } from '@/lib/api'
import { Search, AlertCircle, Printer, X, Filter, Calendar as CalendarIcon, Wallet, Scale, LayoutGrid, LayoutList, Square, CheckSquare, Edit2, Trash2, Eye, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import RosokSaleForm from './RosokSaleForm'
import { toast } from 'react-hot-toast'
import Modal from '@/components/ui/Modal'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import RosokReceipt from './RosokReceipt'
import RosokReportPrint from './RosokReportPrint'
import RosokCard from './RosokCard'

export default function RosokSaleList() {
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
    const [detailSale, setDetailSale] = useState<any>(null)

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    // Printing refs and state (kept for functionality)
    const [printSaleData, setPrintSaleData] = useState<any>(null)
    const [printReportData, setPrintReportData] = useState<any[]>([])

    const { data: sales, isLoading, error } = useQuery({
        queryKey: ['rosok-sales'],
        queryFn: async () => {
            const response = await rosokApi.getAll()
            return response.data
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rosokApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rosok-sales'] })
            toast.success('Transaksi berhasil dihapus')
            setDeleteId(null)
            setSelectedIds([])
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Gagal menghapus data')
        },
    })

    const handleEdit = (sale: any) => {
        setSelectedSale(sale)
        setIsFormOpen(true)
    }

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate(deleteId)
        }
    }

    const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA').slice(0, 8) + '01')
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'))

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

    const handleSelectAll = () => {
        if (selectedIds.length === filteredSales?.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredSales?.map((s: any) => s.id) || [])
        }
    }

    const handleSelectRow = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(itemId => itemId !== id))
        } else {
            setSelectedIds(prev => [...prev, id])
        }
    }

    const triggerPrintReceipt = (sale: any) => {
        setPrintReportData([])
        setPrintSaleData(sale)
    }

    const triggerPrintSelected = () => {
        const selectedData = sales?.filter((s: any) => selectedIds.includes(s.id)) || []
        selectedData.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())

        setPrintSaleData(null)
        setPrintReportData(selectedData)
    }

    React.useEffect(() => {
        if (printSaleData || (printReportData && printReportData.length > 0)) {
            const timer = setTimeout(() => {
                window.print()
            }, 500) // Increased timeout slightly to ensure rendering
            return () => clearTimeout(timer)
        }
    }, [printSaleData, printReportData])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 bg-white border border-red-100 rounded-2xl shadow-sm flex items-center justify-center gap-3 text-red-600">
                <AlertCircle className="w-6 h-6" />
                <p className="font-medium">Gagal memuat data penjualan rosok</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Print Preview Overlay */}
            {(printSaleData || (printReportData && printReportData.length > 0)) && (
                <div className="fixed inset-0 z-[50] bg-white flex flex-col items-center overflow-auto p-4 sm:p-8">
                    <div className="w-full max-w-5xl flex justify-between items-center mb-6 print:hidden">
                        <h2 className="text-xl font-bold text-gray-800">Pratinjau Cetak</h2>
                        <div className="flex gap-3">
                            <Button onClick={() => window.print()}>
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak
                            </Button>
                            <Button variant="outline" onClick={() => { setPrintSaleData(null); setPrintReportData([]); }}>
                                <X className="w-4 h-4 mr-2" />
                                Tutup
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 w-full flex justify-center min-h-[500px]">
                        {printSaleData && <RosokReceipt sale={printSaleData} />}
                        {printReportData.length > 0 && (
                            <RosokReportPrint
                                sales={printReportData}
                                period={
                                    startDate && endDate
                                        ? `${format(new Date(startDate), 'dd MMMM yyyy', { locale: id })} - ${format(new Date(endDate), 'dd MMMM yyyy', { locale: id })}`
                                        : 'Semua Periode'
                                }
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Stats Cards - Modern Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-xl shadow-indigo-500/20">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-white/90 mb-2">
                            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm text-white">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">Total Pendapatan</span>
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight mb-1 text-white">
                            Rp {totalRevenue.toLocaleString('id-ID')}
                        </h3>
                        <p className="text-white/80 text-xs font-medium truncate">
                            {filteredSales?.length || 0} transaksi
                        </p>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="relative z-10 opacity-90">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Scale className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm text-gray-500">Total Berat</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                            {totalWeight.toLocaleString('id-ID')} <span className="text-sm text-gray-400 font-bold">kg</span>
                        </h3>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="relative z-10 opacity-90">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <LayoutList className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm text-gray-500">Transaksi</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                            {filteredSales?.length || 0}
                        </h3>
                    </div>
                </div>

                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="relative z-10 opacity-90">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm text-gray-500">Rata-rata</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                            Rp {filteredSales?.length ? Math.round(totalRevenue / filteredSales.length).toLocaleString('id-ID') : 0}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Toolbar - Search & Actions */}
            <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm flex flex-col xl:flex-row gap-3">
                    <div className="flex-1 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                id="rosok-search"
                                name="rosokSearch"
                                type="text"
                                placeholder="Cari..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-2 md:py-0 border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all overflow-x-auto">
                            <CalendarIcon className="w-5 h-5 text-gray-400 ml-2" />
                            <input
                                id="rosok-start-date"
                                name="rosokStartDate"
                                aria-label="Tanggal Mulai"
                                type="date"
                                className="w-28 md:w-32 bg-transparent border-none focus:ring-0 text-xs md:text-sm font-medium text-gray-700 p-0"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <span className="text-gray-300">|</span>
                            <input
                                id="rosok-end-date"
                                name="rosokEndDate"
                                aria-label="Tanggal Selesai"
                                type="date"
                                className="w-28 md:w-32 bg-transparent border-none focus:ring-0 text-xs md:text-sm font-medium text-gray-700 p-0"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan Grid"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Tampilan List"
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                        </div>

                        {selectedIds.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={triggerPrintSelected}
                                className="flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" /> Cetak ({selectedIds.length})
                            </Button>
                        )}
                        <Button onClick={() => { setSelectedSale(null); setIsFormOpen(true); }}>
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span>Catat Transaksi Baru</span>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredSales?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak ada transaksi ditemukan</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Coba sesuaikan kata kunci pencarian atau filter tanggal Anda. Atau buat transaksi baru.
                    </p>
                    <Button
                        variant="ghost"
                        onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate('') }}
                        className="mt-6 text-blue-600 hover:bg-blue-50"
                    >
                        Reset Filter
                    </Button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredSales?.map((sale: any) => (
                        <RosokCard
                            key={sale.id}
                            sale={sale}
                            isSelected={selectedIds.includes(sale.id)}
                            onSelect={() => handleSelectRow(sale.id)}
                            onEdit={() => handleEdit(sale)}
                            onDelete={() => handleDelete(sale.id)}
                            onPrint={() => triggerPrintReceipt(sale)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="w-12 px-6 py-4">
                                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-blue-600">
                                            {selectedIds.length > 0 && selectedIds.length === filteredSales?.length ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pembeli</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Berat</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredSales?.map((sale: any) => (
                                    <tr key={sale.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(sale.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleSelectRow(sale.id)} className="text-gray-400 hover:text-blue-600">
                                                {selectedIds.includes(sale.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                            {format(new Date(sale.tanggal), 'dd MMM yyyy', { locale: id })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{sale.pembeli || '-'}</div>
                                            {sale.catatan && <div className="text-xs text-gray-400 italic">{sale.catatan}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                {sale.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                                            {(sale.items?.reduce((sum: number, i: any) => sum + i.berat, 0) || 0).toLocaleString('id-ID')} kg
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                            Rp {(sale.items?.reduce((sum: number, i: any) => sum + i.total_harga, 0) || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setDetailSale(sale)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600" title="Lihat Detail"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => triggerPrintReceipt(sale)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700" title="Cetak"><Printer className="w-4 h-4" /></button>
                                                <button onClick={() => handleEdit(sale)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-orange-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(sale.id)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <RosokSaleForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setSelectedSale(null); }}
                initialData={selectedSale}
                onSuccess={() => {
                    // Success handled by query invalidation
                }}
            />

            <Modal
                isOpen={!!detailSale}
                onClose={() => setDetailSale(null)}
                title="Detail Penjualan Rosok"
            >
                {detailSale && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Tanggal Transaksi</label>
                                <div className="font-bold text-gray-900 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                                    {format(new Date(detailSale.tanggal), 'dd MMMM yyyy, HH:mm', { locale: id })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Pembeli</label>
                                <div className="font-bold text-gray-900 uppercase">{detailSale.pembeli || '-'}</div>
                            </div>

                            <div className="col-span-2 pt-2 border-t border-gray-200 mt-2">
                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Catatan</label>
                                <div className="text-gray-700 italic text-sm">{detailSale.catatan || '-'}</div>
                            </div>
                        </div>

                        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-gray-500 font-bold uppercase text-xs">Jenis Barang</th>
                                        <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase text-xs">Berat (kg)</th>
                                        <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase text-xs">Harga/kg</th>
                                        <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase text-xs">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {detailSale.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{item.jenis_barang}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{item.berat}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">Rp {item.harga_per_kg?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">Rp {item.total_harga?.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50/80 border-t border-gray-100 font-bold">
                                    <tr>
                                        <td className="px-4 py-3 text-gray-700">Total Akhir</td>
                                        <td className="px-4 py-3 text-right text-gray-800">
                                            {detailSale.items.reduce((acc: number, item: any) => acc + item.berat, 0)}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right text-blue-600">
                                            Rp {detailSale.items.reduce((acc: number, item: any) => acc + item.total_harga, 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="text-xs text-gray-400">
                                ID: <span className="font-mono">{detailSale.id.substring(0, 8)}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setDetailSale(null)}>Tutup</Button>
                                <Button onClick={() => { triggerPrintReceipt(detailSale); setDetailSale(null); }}>
                                    <Printer className="w-4 h-4 mr-2" /> Cetak Struk
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Konfirmasi Hapus"
                size="sm"
            >
                <div className="p-1">
                    <p className="text-gray-600 mb-6">
                        Apakah Anda yakin ingin menghapus data penjualan rosok ini?
                        <br />
                        <span className="text-sm text-red-500 mt-2 block bg-red-50 p-2 rounded-lg border border-red-100">
                            Tindakan ini permanen dan tidak dapat dibatalkan.
                        </span>
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteId(null)}
                            disabled={deleteMutation.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete}
                            isLoading={deleteMutation.isPending}
                        >
                            Ya, Hapus
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
