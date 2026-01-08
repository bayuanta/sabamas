'use client'

import AdminLayout from '@/components/AdminLayout'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api'
import { formatCurrency, formatDateTime, formatMonth } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Receipt, Trash2, Filter, Download, Calendar, Search, ArrowLeft, ArrowRight, X, CheckCircle, AlertCircle, Printer } from 'lucide-react'
import ReceiptModal from '@/components/transactions/ReceiptModal'

import TransactionReport from '@/components/transactions/TransactionReport'
import { generatePDF } from '@/lib/pdf'
import { generateExcelReport } from '@/lib/excel'

export default function TransactionsPage() {
  const queryClient = useQueryClient()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [metodeBayar, setMetodeBayar] = useState('')
  const [page, setPage] = useState(1)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<any>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', { dateFrom, dateTo, metodeBayar, page }],
    queryFn: async () => {
      const params: any = { page, limit: 30 }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (metodeBayar) params.metode_bayar = metodeBayar

      const { data } = await paymentsApi.getAll(params)
      return data
    },
  })

  // Log error for debugging
  if (error) {
    console.error('Error loading payments:', error)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.cancel(id),
    onSuccess: () => {
      // Global invalidation
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers-summary'] })
      queryClient.invalidateQueries({ queryKey: ['arrears-report'] })
      queryClient.invalidateQueries({ queryKey: ['customer-portal'] }) // Ensure portal is updated too

      // Specific customer invalidation
      if (selectedPayment?.customer_id) {
        queryClient.invalidateQueries({ queryKey: ['customer', selectedPayment.customer_id] })
        queryClient.invalidateQueries({ queryKey: ['partial-payments', selectedPayment.customer_id] })
      } else {
        // Fallback broad invalidation
        queryClient.invalidateQueries({ queryKey: ['customer'] })
        queryClient.invalidateQueries({ queryKey: ['partial-payments'] })
      }

      setDeleteModalOpen(false)
      setSelectedPayment(null)
    },
  })

  const handleDelete = (payment: any) => {
    setSelectedPayment(payment)
    setDeleteModalOpen(true)
  }

  const handleReceipt = (payment: any) => {
    setSelectedReceiptPayment(payment)
    setReceiptModalOpen(true)
  }

  // Helper: Check if month is in the future
  const isFutureMonth = (monthStr: string): boolean => {
    const [year, month] = monthStr.split('-').map(Number)
    const monthDate = new Date(year, month - 1, 1)
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return monthDate > currentMonth
  }

  // Check if payment includes prepaid months
  const hasPrepaidMonths = (payment: any): boolean => {
    if (!Array.isArray(payment.bulan_dibayar)) return false
    return payment.bulan_dibayar.some((month: string) => isFutureMonth(month))
  }

  // Use total amount from server metadata if available, otherwise fallback to local page sum
  const totalAmount = (typeof data?.meta?.totalAmount === 'number')
    ? data.meta.totalAmount
    : (data?.data?.reduce((sum: number, payment: any) => sum + (payment.jumlah_bayar || 0), 0) || 0)
  const totalTransactions = data?.meta?.total || data?.data?.length || 0

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const params: any = { limit: 10000 } // Fetch all (or a large number)
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (metodeBayar) params.metode_bayar = metodeBayar

      const { data } = await paymentsApi.getAll(params)

      if (!data.data || data.data.length === 0) {
        alert('Tidak ada data untuk diexport')
        return
      }

      await generateExcelReport(data.data, dateFrom, dateTo)

    } catch (error) {
      console.error('Export failed:', error)
      alert('Gagal mengexport data')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const handleDownloadPDF = async () => {
    try {
      setIsPrinting(true) // Show report for capture
      await generatePDF('transaction-report', `laporan_transaksi_${new Date().toISOString().split('T')[0]}`)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Gagal membuat PDF')
    } finally {
      setIsPrinting(false)
    }
  }

  // ... existing code ...

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Transaksi</h1>
            <p className="text-gray-500 mt-1 text-lg">Riwayat pembayaran dan aktivitas keuangan</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              onClick={handlePrint}
            >
              <Printer className="w-5 h-5 mr-2 text-gray-500" />
              Cetak
            </Button>
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              onClick={handleDownloadPDF}
            >
              <Download className="w-5 h-5 mr-2 text-gray-500" />
              PDF
            </Button>
            <Button
              variant="secondary"
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
              onClick={handleExport}
              isLoading={isExporting}
              disabled={isExporting}
            >
              <Download className="w-5 h-5 mr-2 text-gray-500" />
              {isExporting ? 'Mengexport...' : 'Excel (.xlsx)'}
            </Button>
          </div>
        </div>

        {/* Hidden Report for Print/PDF */}
        <div className={isPrinting ? "fixed inset-0 z-[9999] bg-white" : "fixed left-[-9999px] top-0"}>
          {/* We render this always but off-screen, or conditionally if needed. 
               For html2canvas it needs to be in DOM. 
               For print, the media query handles visibility. 
               But to avoid performance hit of rendering large list always, we can render it only when needed or keep it simple.
               Let's render it always but off-screen if data exists.
           */}
          {data?.data && (
            <TransactionReport
              data={data.data}
              dateFrom={dateFrom}
              dateTo={dateTo}
              totalAmount={totalAmount}
            />
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-3">
              <Input
                id="dateFrom"
                name="dateFrom"
                type="date"
                label="Dari Tanggal"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Input
                id="dateTo"
                name="dateTo"
                type="date"
                label="Sampai Tanggal"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Select
                id="metodeBayar"
                name="metodeBayar"
                label="Metode Pembayaran"
                value={metodeBayar}
                onChange={(e) => setMetodeBayar(e.target.value)}
                options={[
                  { value: '', label: 'Semua Metode' },
                  { value: 'tunai', label: 'Tunai' },
                  { value: 'transfer', label: 'Transfer Bank' },
                ]}
              />
            </div>
            <div className="md:col-span-3 flex items-end">
              <Button
                variant="secondary"
                className="w-full h-[42px] bg-gray-100 hover:bg-gray-200 border-transparent"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setMetodeBayar('')
                }}
              >
                <Filter className="w-5 h-5 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Receipt className="w-24 h-24 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Transaksi</p>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{totalTransactions}</p>
              <div className="mt-2 text-sm text-gray-500">
                transaksi ditemukan
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle className="w-24 h-24 text-green-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Pemasukan</p>
              <p className="text-4xl font-extrabold text-green-600 tracking-tight">{formatCurrency(totalAmount)}</p>
              <div className="mt-2 text-sm text-gray-500">
                dari hasil filter saat ini
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600 mb-4"></div>
              <p className="text-gray-500 font-medium">Memuat data transaksi...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-bold text-lg mb-2">Gagal memuat data</p>
              <p className="text-gray-500">Silakan coba muat ulang halaman</p>
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Pelanggan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Bulan Dibayar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Metode
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.data.map((payment: any) => (
                      <tr key={payment.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDateTime(payment.tanggal_bayar)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm font-bold text-gray-900">{payment.customer_nama}</div>
                          {payment.customer && (
                            <div className="text-xs text-gray-500 mt-0.5">{payment.customer.wilayah}</div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm text-gray-900 max-w-[200px] truncate">
                            {Array.isArray(payment.bulan_dibayar)
                              ? payment.bulan_dibayar.map((month: string) => formatMonth(month)).join(', ')
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 font-medium">
                            {Array.isArray(payment.bulan_dibayar) ? payment.bulan_dibayar.length : 0} bulan
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(payment.jumlah_bayar)}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${payment.metode_bayar === 'tunai'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                              }`}>
                              {payment.metode_bayar}
                            </span>
                            {payment.is_deposited && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                Disetor
                              </span>
                            )}
                            {hasPrepaidMonths(payment) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                Bayar Dimuka
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReceipt(payment)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Cetak Struk / Share"
                            >
                              <Receipt className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(payment)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={payment.is_deposited}
                              title={payment.is_deposited ? 'Tidak bisa dibatalkan (sudah disetor)' : 'Batalkan pembayaran'}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="text-sm text-gray-500">
                    Halaman <span className="font-bold text-gray-900">{data.meta.page}</span> dari <span className="font-bold text-gray-900">{data.meta.totalPages}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="bg-white hover:bg-gray-50 border border-gray-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Sebelumnya
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.meta.totalPages}
                      className="bg-white hover:bg-gray-50 border border-gray-200"
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Tidak ada transaksi ditemukan</h3>
              <p className="text-gray-500 mt-2">Coba ubah filter pencarian Anda</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Batalkan Pembayaran"
      >
        {selectedPayment && (
          <div className="text-center p-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Batalkan Transaksi?</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin membatalkan pembayaran ini? Tindakan ini akan mengembalikan status tagihan menjadi belum dibayar.
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Pelanggan</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.customer_nama}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Jumlah</p>
                  <p className="font-bold text-red-600">{formatCurrency(selectedPayment.jumlah_bayar)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteMutation.mutate(selectedPayment.id)}
                isLoading={deleteMutation.isPending}
              >
                Ya, Batalkan Transaksi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        payment={selectedReceiptPayment}
      />
    </AdminLayout>
  )
}
